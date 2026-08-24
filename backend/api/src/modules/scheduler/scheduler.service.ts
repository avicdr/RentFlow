import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { startOfDay, endOfDay, subDays, addDays } from 'date-fns';
import { NotificationType } from '../notifications/schemas/notification.schema';

// India-only SaaS — pin cron evaluation to IST so rent dates don't drift on a UTC server.
const TZ = { timeZone: 'Asia/Kolkata' };

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectModel('Tenant') private tenantModel: Model<any>,
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Otp') private otpModel: Model<any>,
    @InjectModel('Notification') private notificationModel: Model<any>,
    @InjectModel('Session') private sessionModel: Model<any>,
  ) {}

  // ── Monthly Rent Record Generation ─────────────────────────────────────────
  // Runs at 06:00 IST on the 1st of every month
  @Cron('0 6 1 * *', { name: 'monthly-rent-generation', ...TZ })
  async generateMonthlyRentRecords() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();
    this.logger.log(`[Scheduler] Generating rent records for ${month}/${year}`);

    const activeTenants = await this.tenantModel
      .find({ status: 'ACTIVE', isDeleted: { $ne: true } })
      .select('_id landlordId organizationId propertyId agreedRent rentDueDay')
      .lean();

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const tenant of activeTenants) {
      try {
        // Skip if a rent record already exists for this tenant/month (idempotent).
        // Mirrors the manual-create dedup in payments.service.ts (type + isDeleted).
        const exists = await this.paymentModel.findOne({
          tenantId: tenant._id, month, year, type: 'RENT', isDeleted: false,
        });
        if (exists) { skipped++; continue; }

        const dueDay = tenant.rentDueDay ?? 5;
        // Clamp the due day to the last day of the target month (e.g. 31st → 28/29 in Feb).
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const dueDate = new Date(year, month - 1, Math.min(dueDay, lastDayOfMonth));

        await this.paymentModel.create({
          tenantId: tenant._id,
          landlordId: tenant.landlordId,
          organizationId: tenant.organizationId,
          propertyId: tenant.propertyId,
          type: 'RENT',
          month,
          year,
          amount: tenant.agreedRent,
          dueDate,
          status: 'PENDING',
        });
        created++;
      } catch (err: any) {
        // Duplicate-key from the unique index means another run already created it — treat as skipped.
        if (err?.code === 11000) { skipped++; continue; }
        failed++;
        this.logger.error(
          `[Scheduler] Rent generation failed for tenant ${tenant._id}: ${err?.message ?? err}`,
        );
      }
    }

    this.logger.log(`[Scheduler] Rent generation: ${created} created, ${skipped} skipped, ${failed} failed`);
  }

  // ── Payment Reminders ───────────────────────────────────────────────────────
  // Runs daily at 08:00 IST
  @Cron('0 8 * * *', { name: 'payment-reminders', ...TZ })
  async dispatchPaymentReminders() {
    const today = new Date();
    const todayDay = today.getDate();
    this.logger.log(`[Scheduler] Dispatching payment reminders (day ${todayDay})`);

    // Reminders fire for rent due in 2 days, due today, or overdue by >= 3 days.
    // Bound the overdue window to 90 days so we don't re-scan ancient unpaid records forever.
    const windowStart = startOfDay(subDays(today, 90));
    const windowEnd = endOfDay(addDays(today, 2));

    const pendingPayments = await this.paymentModel
      .find({
        status: 'PENDING',
        isDeleted: false,
        dueDate: { $gte: windowStart, $lte: windowEnd },
      })
      // Payment has no direct userId — resolve the recipient via Tenant → User.
      .populate({ path: 'tenantId', select: 'userId', populate: { path: 'userId', select: 'firstName email' } })
      .lean();

    let dispatched = 0;
    for (const payment of pendingPayments) {
      try {
        const daysUntilDue = Math.round(
          (new Date(payment.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        let title = '';
        let body = '';
        const amount = Number(payment.amount ?? 0).toLocaleString('en-IN');

        if (daysUntilDue === 2) {
          title = '⏰ Rent Due in 2 Days';
          body = `Your rent of ₹${amount} is due on ${new Date(payment.dueDate).toDateString()}.`;
        } else if (daysUntilDue === 0) {
          title = '🔔 Rent Due Today';
          body = `Your rent of ₹${amount} is due today. Please pay and submit proof.`;
        } else if (daysUntilDue <= -3) {
          title = '❗ Rent Overdue';
          body = `Your rent of ₹${amount} is overdue by ${Math.abs(daysUntilDue)} days. Please pay immediately.`;
        }

        const recipientId = payment.tenantId?.userId?._id;
        if (!title || !recipientId) continue;

        // Dedup: don't send the same reminder twice on the same day.
        const alreadySent = await this.notificationModel.findOne({
          userId: recipientId,
          'data.paymentId': payment._id.toString(),
          'data.reminderDay': String(todayDay),
        });
        if (alreadySent) continue;

        await this.notificationModel.create({
          userId: recipientId,
          type: NotificationType.PAYMENT_DUE,
          title,
          body,
          isRead: false,
          data: { paymentId: payment._id.toString(), reminderDay: String(todayDay) },
        });
        dispatched++;
      } catch (err: any) {
        this.logger.error(
          `[Scheduler] Reminder failed for payment ${payment?._id}: ${err?.message ?? err}`,
        );
      }
    }

    this.logger.log(`[Scheduler] Dispatched ${dispatched} payment reminders`);
  }

  // ── OTP Cleanup ─────────────────────────────────────────────────────────────
  // Every 15 minutes
  @Cron('0 */15 * * * *', { name: 'otp-cleanup' })
  async cleanupExpiredOtps() {
    try {
      const result = await this.otpModel.deleteMany({ expiresAt: { $lt: new Date() } });
      if (result.deletedCount > 0) {
        this.logger.debug(`[Scheduler] OTP cleanup: deleted ${result.deletedCount} expired OTPs`);
      }
    } catch (err: any) {
      this.logger.error(`[Scheduler] OTP cleanup failed: ${err?.message ?? err}`);
    }
  }

  // ── Session Cleanup ─────────────────────────────────────────────────────────
  // Every day at 03:00
  @Cron('0 3 * * *', { name: 'session-cleanup' })
  async cleanupExpiredSessions() {
    try {
      const result = await this.sessionModel.deleteMany({ expiresAt: { $lt: new Date() } });
      this.logger.log(`[Scheduler] Session cleanup: deleted ${result.deletedCount} expired sessions`);
    } catch (err: any) {
      this.logger.error(`[Scheduler] Session cleanup failed: ${err?.message ?? err}`);
    }
  }

  // ── Notification Cleanup ────────────────────────────────────────────────────
  // Every day at 04:00 — keep max 90 days of read notifications
  @Cron('0 4 * * *', { name: 'notification-cleanup' })
  async cleanupOldNotifications() {
    try {
      const cutoff = subDays(new Date(), 90);
      const result = await this.notificationModel.deleteMany({
        isRead: true,
        createdAt: { $lt: cutoff },
      });
      this.logger.log(`[Scheduler] Notification cleanup: deleted ${result.deletedCount} old notifications`);
    } catch (err: any) {
      this.logger.error(`[Scheduler] Notification cleanup failed: ${err?.message ?? err}`);
    }
  }
}
