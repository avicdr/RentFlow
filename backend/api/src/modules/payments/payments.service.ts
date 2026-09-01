import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { CreatePaymentDto, SubmitPaymentDto, ApprovePaymentDto, RejectPaymentDto } from './dto/payment.dto';
import { ReceiptService } from './receipt.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../notifications/mail.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Property') private propertyModel: Model<any>,
    private receiptService: ReceiptService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
    private auditService: AuditService,
  ) {}

  private async assertPaymentPropertyAccess(propertyId: string | Types.ObjectId, userId: string, role: string, requiredPermission?: string) {
    if (role === 'SUPER_ADMIN') return;
    const propId = typeof propertyId === 'string' ? new Types.ObjectId(propertyId) : propertyId;
    if (role === 'LANDLORD') {
      const prop = await this.propertyModel.findOne({ _id: propId, landlordId: new Types.ObjectId(userId), isDeleted: false });
      if (!prop) throw new ForbiddenException('You do not own this property');
      return;
    }
    if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.paymentModel.db.model('PropertyManagerAssignment');
      const assignment = await assignmentModel.findOne({
        userId: new Types.ObjectId(userId),
        propertyId: propId,
        status: 'ACTIVE',
        isDeleted: false,
      });
      if (!assignment) throw new ForbiddenException('You are not assigned to this property');
      if (requiredPermission && (assignment as any).permissions && !(assignment as any).permissions[requiredPermission]) {
        throw new ForbiddenException(`You do not have permission (${requiredPermission}) on this property`);
      }
      return;
    }
    throw new ForbiddenException('Access denied');
  }

  // Landlord/PM creates monthly rent due
  async create(userId: string, role = 'LANDLORD', dto: CreatePaymentDto) {
    const tenant = await this.tenantModel.findById(dto.tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const propertyId = dto.propertyId || tenant.propertyId;
    await this.assertPaymentPropertyAccess(propertyId, userId, role, 'recordPayments');

    const landlordId = tenant.landlordId;

    // Check duplicate for same tenant/month/year
    const existing = await this.paymentModel.findOne({
      tenantId: new Types.ObjectId(dto.tenantId),
      month: dto.month,
      year: dto.year,
      type: dto.type ?? 'RENT',
      isDeleted: false,
    });
    if (existing) throw new BadRequestException('Payment record for this month already exists');

    let payment;
    try {
      payment = await this.paymentModel.create({
        tenantId: new Types.ObjectId(dto.tenantId),
        landlordId: new Types.ObjectId(landlordId),
        propertyId: new Types.ObjectId(propertyId),
        organizationId: tenant.organizationId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        month: dto.month,
        year: dto.year,
        type: dto.type ?? 'RENT',
        latePenalty: dto.latePenalty ?? 0,
        notes: dto.notes ?? '',
      });
    } catch (err: any) {
      // Unique-index backstop against a race between the check above and this insert.
      if (err?.code === 11000) throw new BadRequestException('Payment record for this month already exists');
      throw err;
    }

    // Notify tenant
    const tenantUser = await this.userModel.findById(tenant.userId);
    if (tenantUser) {
      await this.notificationsService.create(
        tenant.userId, NotificationType.PAYMENT_DUE,
        'Rent Due',
        `Your rent of ₹${dto.amount.toLocaleString('en-IN')} is due on ${new Date(dto.dueDate).toLocaleDateString('en-IN')}.`,
        { paymentId: payment._id.toString() },
      );
      await this.mailService.sendRentReminder(
        tenantUser.email, dto.amount, new Date(dto.dueDate), 'your property',
      );
    }

    await this.auditService.log(userId, 'PAYMENT_CREATED', 'Payment', payment._id.toString(), {}, { amount: dto.amount, month: dto.month, year: dto.year });
    return { message: 'Payment record created', data: payment };
  }

  // Tenant submits payment proof
  async submit(paymentId: string, tenantUserId: string, dto: SubmitPaymentDto, ip: string) {
    const tenant = await this.tenantModel.findOne({ userId: new Types.ObjectId(tenantUserId) });
    if (!tenant) throw new NotFoundException('Tenant record not found');

    const payment = await this.paymentModel.findOne({
      _id: new Types.ObjectId(paymentId),
      tenantId: tenant._id,
      isDeleted: false,
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.PAID)
      throw new BadRequestException('Payment already verified as paid');
    if (payment.status === PaymentStatus.UNDER_REVIEW)
      throw new BadRequestException('Payment is already under review');

    // Duplicate UTR check — skip for cash/cheque where there's no UTR
    const isCashOrCheque = ['CASH', 'CHEQUE'].includes(dto.paymentMethod);
    const utrUpper = dto.utrNumber?.trim().toUpperCase() || '';
    if (utrUpper && !isCashOrCheque) {
      const duplicate = await this.paymentModel.findOne({
        'submission.utrNumber': utrUpper,
        _id: { $ne: payment._id },
      });
      if (duplicate) throw new BadRequestException('This UTR number has already been submitted');
    }

    await this.paymentModel.updateOne({ _id: payment._id }, {
      status: PaymentStatus.PAYMENT_SUBMITTED,
      submission: {
        screenshotPath: dto.screenshotPath ?? '',
        utrNumber: utrUpper,
        paymentMethod: dto.paymentMethod,
        paymentApp: dto.paymentApp,
        paidAmount: dto.paidAmount,
        note: dto.note ?? '',
        submittedAt: new Date(),
        ipAddress: ip,
      },
    });

    // Notify landlord
    await this.notificationsService.create(
      payment.landlordId, NotificationType.PAYMENT_SUBMITTED,
      'Payment Proof Submitted',
      `Tenant submitted rent proof for ${payment.month}/${payment.year}. UTR: ${utrUpper}`,
      { paymentId: paymentId },
    );

    await this.auditService.log(tenantUserId, 'PAYMENT_SUBMITTED', 'Payment', paymentId, { status: 'PENDING' }, { status: 'PAYMENT_SUBMITTED', utr: utrUpper });
    return { message: 'Payment proof submitted for landlord review' };
  }

  // Landlord or PM approves payment
  async approve(paymentId: string, userId: string, role = 'LANDLORD', dto: ApprovePaymentDto) {
    if (!Types.ObjectId.isValid(paymentId)) throw new NotFoundException('Payment not found');
    const existingPayment = await this.paymentModel.findById(paymentId);
    if (!existingPayment || existingPayment.isDeleted) throw new NotFoundException('Payment not found');

    await this.assertPaymentPropertyAccess(existingPayment.propertyId, userId, role, 'recordPayments');

    const payment = await this.paymentModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(paymentId),
          isDeleted: false,
          status: { $in: [PaymentStatus.PAYMENT_SUBMITTED, PaymentStatus.UNDER_REVIEW] },
        },
        {
          $set: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            verification: {
              verifiedBy: new Types.ObjectId(userId),
              verifiedAt: new Date(),
              action: 'APPROVED',
              disputeNote: dto.disputeNote ?? '',
            },
          },
        },
        { new: true },
      )
      .populate('tenantId')
      .populate('propertyId');

    if (!payment) {
      throw new BadRequestException('Payment is not awaiting approval (already processed?)');
    }

    const tenant = payment.tenantId as any;
    const property = payment.propertyId as any;
    const tenantUser = await this.userModel.findById(tenant.userId);
    const landlordUser = await this.userModel.findById(payment.landlordId);

    // Generate receipt and attach it. The payment is already PAID at this point; if receipt
    // generation fails we log and continue rather than leaving the approval half-applied.
    let receiptData: any = null;
    try {
      receiptData = await this.receiptService.generate(payment, tenantUser, property, landlordUser);
      await this.paymentModel.updateOne({ _id: payment._id }, { $set: { receipt: receiptData } });
    } catch (err: any) {
      // Payment stays PAID; receipt can be regenerated. Surface in logs, don't fail the request.
      console.error(`Receipt generation failed for payment ${paymentId}:`, err?.message ?? err);
    }

    // Notifications and email are best-effort — a mail/SMTP failure must not fail an approved payment.
    try {
      if (tenantUser) {
        await this.notificationsService.create(
          tenant.userId, NotificationType.PAYMENT_VERIFIED,
          '✅ Payment Verified',
          `Rent for ${payment.month}/${payment.year} verified.${receiptData ? ` Receipt: ${receiptData.receiptId}` : ''}`,
          receiptData ? { paymentId, receiptId: receiptData.receiptId } : { paymentId },
        );
        await this.mailService.sendPaymentVerified(
          tenantUser.email, receiptData?.receiptId ?? 'PENDING', payment.amount, payment.month, payment.year,
        );
      }
    } catch (err: any) {
      console.error(`Post-approval notification failed for payment ${paymentId}:`, err?.message ?? err);
    }

    await this.auditService.log(userId, 'PAYMENT_APPROVED', 'Payment', paymentId, {}, { status: 'PAID', receiptId: receiptData?.receiptId ?? null });
    return { message: 'Payment approved and receipt generated', data: { receiptId: receiptData?.receiptId ?? null, downloadUrl: receiptData?.downloadUrl ?? null } };
  }

  // Landlord or PM rejects payment
  async reject(paymentId: string, userId: string, role = 'LANDLORD', dto: RejectPaymentDto) {
    if (!Types.ObjectId.isValid(paymentId)) throw new NotFoundException('Payment not found');
    const existingPayment = await this.paymentModel.findById(paymentId);
    if (!existingPayment || existingPayment.isDeleted) throw new NotFoundException('Payment not found');

    await this.assertPaymentPropertyAccess(existingPayment.propertyId, userId, role, 'recordPayments');

    const payment = await this.paymentModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(paymentId),
          isDeleted: false,
          status: { $in: [PaymentStatus.PAYMENT_SUBMITTED, PaymentStatus.UNDER_REVIEW] },
        },
        {
          $set: {
            status: PaymentStatus.PENDING, // Reset to pending so tenant can resubmit
            submission: null,
            verification: {
              verifiedBy: new Types.ObjectId(userId),
              verifiedAt: new Date(),
              action: 'REJECTED',
              rejectionReason: dto.reason,
            },
          },
        },
        { new: true },
      )
      .populate('tenantId');

    if (!payment) {
      throw new BadRequestException('Payment not found or not in submitted state');
    }

    const tenant = payment.tenantId as any;
    if (tenant?.userId) {
      await this.notificationsService.create(
        tenant.userId, NotificationType.PAYMENT_REJECTED,
        '❌ Payment Rejected',
        `Your payment proof for ${payment.month}/${payment.year} was rejected. Reason: ${dto.reason}`,
        { paymentId, reason: dto.reason },
      );
    }

    // Audit reflects the real resulting status (PENDING, so the tenant can resubmit).
    await this.auditService.log(userId, 'PAYMENT_REJECTED', 'Payment', paymentId, { status: 'PAYMENT_SUBMITTED' }, { status: 'PENDING', reason: dto.reason });
    return { message: 'Payment rejected. Tenant notified to resubmit.' };
  }

  async setUnderReview(paymentId: string, userId: string, role = 'LANDLORD') {
    if (!Types.ObjectId.isValid(paymentId)) throw new NotFoundException('Payment not found');
    const existingPayment = await this.paymentModel.findById(paymentId);
    if (!existingPayment || existingPayment.isDeleted) throw new NotFoundException('Payment not found');

    await this.assertPaymentPropertyAccess(existingPayment.propertyId, userId, role, 'recordPayments');

    const result = await this.paymentModel.updateOne(
      { _id: new Types.ObjectId(paymentId), status: PaymentStatus.PAYMENT_SUBMITTED },
      { status: PaymentStatus.UNDER_REVIEW },
    );
    if (result.matchedCount === 0) throw new BadRequestException('Payment not in submitted state');
    return { message: 'Payment marked as under review' };
  }

  async findAll(userId: string, role: string, filters: { status?: string; month?: number; year?: number; tenantId?: string; propertyId?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const query: any = { isDeleted: false };

    if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.paymentModel.db.model('PropertyManagerAssignment');
      const assignments = await assignmentModel.find({
        userId: new Types.ObjectId(userId),
        status: 'ACTIVE',
        isDeleted: false,
      }).select('propertyId');
      const assignedPropIds = assignments.map((a: any) => a.propertyId);
      
      if (filters.propertyId) {
        const match = assignedPropIds.some((p: any) => p.toString() === filters.propertyId);
        if (!match) throw new ForbiddenException('You do not have access to this property');
        query.propertyId = new Types.ObjectId(filters.propertyId);
      } else {
        query.propertyId = { $in: assignedPropIds };
      }
    } else if (role === 'LANDLORD') {
      query.landlordId = new Types.ObjectId(userId);
      if (filters.propertyId) query.propertyId = new Types.ObjectId(filters.propertyId);
    } else if (role === 'TENANT') {
      const tenant = await this.tenantModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!tenant) return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
      query.tenantId = tenant._id;
    }

    if (filters.status) query.status = filters.status;
    if (filters.month) query.month = filters.month;
    if (filters.year) query.year = filters.year;
    if (filters.tenantId && role !== 'TENANT') query.tenantId = new Types.ObjectId(filters.tenantId);

    const [payments, total] = await Promise.all([
      this.paymentModel.find(query)
        .populate({ path: 'tenantId', populate: { path: 'userId', select: 'firstName lastName phone' } })
        .populate('propertyId', 'name address')
        .sort({ dueDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.paymentModel.countDocuments(query),
    ]);

    return { data: payments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: string) {
    const payment = await this.paymentModel.findById(id)
      .populate({ path: 'tenantId', populate: { path: 'userId', model: 'User' } })
      .populate('propertyId', 'name address paymentMethods');

    if (!payment || payment.isDeleted) throw new NotFoundException('Payment not found');

    if (role === 'LANDLORD' && payment.landlordId.toString() !== userId)
      throw new ForbiddenException('Access denied');

    if (role === 'PROPERTY_MANAGER') {
      await this.assertPaymentPropertyAccess(payment.propertyId?._id || payment.propertyId, userId, role, 'viewPayments');
    }

    if (role === 'TENANT') {
      const tenant = await this.tenantModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!tenant || payment.tenantId._id.toString() !== tenant._id.toString())
        throw new ForbiddenException('Access denied');
    }

    return { data: payment };
  }

  async getReceipt(paymentId: string, userId: string, role: string) {
    const { data: payment } = await this.findOne(paymentId, userId, role);
    if (!payment.receipt) throw new NotFoundException('Receipt not available');
    if (!fs.existsSync(payment.receipt.pdfPath))
      throw new NotFoundException('Receipt file not found');
    return payment.receipt;
  }

  async getPendingReview(userId: string, role = 'LANDLORD') {
    const match: any = {
      status: { $in: [PaymentStatus.PAYMENT_SUBMITTED, PaymentStatus.UNDER_REVIEW] },
      isDeleted: false,
    };

    if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.paymentModel.db.model('PropertyManagerAssignment');
      const assignments = await assignmentModel.find({
        userId: new Types.ObjectId(userId),
        status: 'ACTIVE',
        isDeleted: false,
      }).select('propertyId');
      const assignedPropIds = assignments.map((a: any) => a.propertyId);
      match.propertyId = { $in: assignedPropIds };
    } else if (role !== 'SUPER_ADMIN') {
      match.landlordId = new Types.ObjectId(userId);
    }

    return this.paymentModel.aggregate([
      { $match: match },
      { $lookup: { from: 'tenants', localField: 'tenantId', foreignField: '_id', as: 'tenant' } },
      { $unwind: '$tenant' },
      { $lookup: { from: 'users', localField: 'tenant.userId', foreignField: '_id', as: 'tenantUser' } },
      { $unwind: '$tenantUser' },
      { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'property' } },
      { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
      { $project: {
          amount: 1, month: 1, year: 1, dueDate: 1, status: 1, submission: 1, createdAt: 1,
          tenantName: { $concat: ['$tenantUser.firstName', ' ', '$tenantUser.lastName'] },
          tenantPhone: '$tenantUser.phone', tenantEmail: '$tenantUser.email',
          propertyName: '$property.name',
        }
      },
      { $sort: { 'submission.submittedAt': 1 } },
    ]);
  }
}
