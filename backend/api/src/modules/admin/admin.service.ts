import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { DocModel } from '../documents/schemas/document.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Property') private propertyModel: Model<any>,
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Complaint') private complaintModel: Model<any>,
    @InjectModel('Organization') private orgModel: Model<any>,
    @InjectModel(DocModel.name) private docModel: Model<any>,
    @InjectModel(Tenant.name) private tenantModel: Model<any>,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) { }

  async getPlatformStats() {
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    const [
      totalUsers, totalLandlords, totalTenants, totalBrokers, totalPropertyManagers,
      newUsersThisMonth, newUsersLastMonth,
      totalProperties, activeProperties,
      totalRevenueThisMonth, totalRevenueLastMonth,
      paidPaymentsThisMonth,
      openComplaints, criticalComplaints,
      revenueChart,
    ] = await Promise.all([
      this.userModel.countDocuments({ isDeleted: false }),
      this.userModel.countDocuments({ role: 'LANDLORD', isDeleted: false }),
      this.userModel.countDocuments({ role: 'TENANT', isDeleted: false }),
      this.userModel.countDocuments({ role: 'BROKER', isDeleted: false }),
      this.userModel.countDocuments({ role: 'PROPERTY_MANAGER', isDeleted: false }),
      this.userModel.countDocuments({ isDeleted: false, createdAt: { $gte: startOfThisMonth } }),
      this.userModel.countDocuments({ isDeleted: false, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      this.propertyModel.countDocuments({ isDeleted: false }),
      this.propertyModel.countDocuments({ status: 'ACTIVE', isDeleted: false }),
      this.paymentModel.aggregate([
        { $match: { status: 'PAID', dueDate: { $gte: startOfThisMonth, $lte: endOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then(r => r[0]?.total ?? 0),
      this.paymentModel.aggregate([
        { $match: { status: 'PAID', dueDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then(r => r[0]?.total ?? 0),
      this.paymentModel.countDocuments({ status: 'PAID', dueDate: { $gte: startOfThisMonth, $lte: endOfThisMonth } }),
      this.complaintModel.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      this.complaintModel.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] }, priority: 'CRITICAL' }),
      Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const d = subMonths(now, 5 - i);
          return this.paymentModel.aggregate([
            { $match: { status: 'PAID', dueDate: { $gte: startOfMonth(d), $lte: endOfMonth(d) } } },
            { $group: { _id: null, collected: { $sum: '$amount' } } },
          ]).then(r => ({ month: format(d, 'MMM yy'), collected: r[0]?.collected ?? 0 }));
        }),
      ),
    ]);

    // SaaS / subscription metrics
    const [totalOrgs, subscriptionBreakdown, activeOrgs] = await Promise.all([
      this.orgModel.countDocuments({ isDeleted: false }),
      this.orgModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$tier', count: { $sum: 1 } } },
      ]),
      this.orgModel.countDocuments({ isDeleted: false, subscriptionStatus: 'ACTIVE' }),
    ]);

    const TIER_PRICES: Record<string, number> = {
      LITE: 99,
      STARTER: 299,
      GROWTH: 699,
      PROFESSIONAL: 1499,
      BUSINESS: 2999,
      ENTERPRISE: 0,
      // Legacy tier aliases
      SOLO: 99,
      SCALE: 1499,
    };
    const tierMap: Record<string, number> = {
      LITE: 0,
      STARTER: 0,
      GROWTH: 0,
      PROFESSIONAL: 0,
      BUSINESS: 0,
      ENTERPRISE: 0,
    };
    let mrr = 0;
    for (const t of subscriptionBreakdown) {
      const normalizedTier = t._id === 'SOLO' ? 'LITE' : t._id === 'SCALE' ? 'PROFESSIONAL' : t._id;
      tierMap[normalizedTier] = (tierMap[normalizedTier] || 0) + t.count;
      mrr += (TIER_PRICES[t._id] ?? 0) * t.count;
    }

    const userGrowthPct = newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : 0;
    const revenueGrowthPct = totalRevenueLastMonth > 0
      ? Math.round(((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth) * 100)
      : 0;

    return {
      totalUsers, totalLandlords, totalTenants, totalBrokers, totalPropertyManagers,
      newUsersThisMonth, userGrowthPct,
      totalProperties, activeProperties,
      totalRevenueThisMonth, revenueGrowthPct,
      paidPaymentsThisMonth,
      openComplaints, criticalComplaints,
      revenueChart,
      // SaaS metrics
      totalOrgs, activeOrgs, mrr,
      subscriptionBreakdown: tierMap,
    };
  }

  /** Escapes special regex metacharacters so user input is treated as a
   *  literal substring search. Prevents ReDoS (catastrophic backtracking).
   */
  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async getUsers(query: any) {
    const page = +query.page || 1;
    const limit = +query.limit || 25;
    const filter: any = { isDeleted: false };
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) {
      const safe = this.escapeRegex(String(query.search).slice(0, 100));
      filter.$or = [
        { email: { $regex: safe, $options: 'i' } },
        { firstName: { $regex: safe, $options: 'i' } },
        { lastName: { $regex: safe, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      this.userModel.find(filter)
        .select('-passwordHash -aadhaarData -refreshTokenHash')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.userModel.countDocuments(filter),
    ]);
    return { data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async suspendUser(id: string, adminId: string) {
    await this.userModel.updateOne({ _id: new Types.ObjectId(id) }, { status: 'SUSPENDED' });
    await this.auditService.log(adminId, 'USER_SUSPENDED', 'User', id, { status: 'ACTIVE' }, { status: 'SUSPENDED' }, 'WARNING');
    return { message: 'User suspended' };
  }

  async activateUser(id: string, adminId: string) {
    await this.userModel.updateOne({ _id: new Types.ObjectId(id) }, { status: 'ACTIVE' });
    await this.auditService.log(adminId, 'USER_ACTIVATED', 'User', id, { status: 'SUSPENDED' }, { status: 'ACTIVE' });
    return { message: 'User activated' };
  }

  async getAllProperties(query: any) {
    const page = +query.page || 1;
    const limit = +query.limit || 25;
    const match: any = { isDeleted: false };
    if (query.status) match.status = query.status;
    if (query.search) match.name = { $regex: this.escapeRegex(String(query.search).slice(0, 100)), $options: 'i' };

    const [result, totalArr] = await Promise.all([
      this.propertyModel.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'landlordId',
            foreignField: '_id',
            as: 'landlord',
            pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
          },
        },
        { $addFields: { landlordId: { $arrayElemAt: ['$landlord', 0] } } },
        { $project: { landlord: 0 } },
      ]),
      this.propertyModel.countDocuments(match),
    ]);

    const total = totalArr;
    return { data: result, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getPendingKyc(query: { search?: string }) {
    const filter: any = {
      isDeleted: false,
      $or: [
        { status: { $in: ['PENDING_VERIFICATION', 'KYC_UNDER_REVIEW', 'KYC_PENDING', 'KYC_REJECTED', 'INACTIVE'] } },
        { 'verificationStatus.aadhaar': { $in: ['PENDING', 'REJECTED'] } },
        { kycData: { $exists: true, $ne: null } },
      ],
    };

    if (query.search) {
      const safe = this.escapeRegex(String(query.search).slice(0, 100));
      filter.$and = [
        {
          $or: [
            { email: { $regex: safe, $options: 'i' } },
            { firstName: { $regex: safe, $options: 'i' } },
            { lastName: { $regex: safe, $options: 'i' } },
            { phone: { $regex: safe, $options: 'i' } },
          ],
        },
      ];
    }

    const users = await this.userModel
      .find(filter)
      .select('-passwordHash -refreshTokenHash')
      .sort({ updatedAt: -1 })
      .lean();

    // Populate KYC documents uploaded by each user
    const usersWithDocs = await Promise.all(
      users.map(async (u: any) => {
        const kycDocs = await this.docModel
          .find({ uploadedBy: u._id, isDeleted: false })
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...u,
          kycDocuments: kycDocs,
        };
      }),
    );

    return { data: usersWithDocs };
  }

  async approveKyc(userId: string, adminId: string) {
    const uid = new Types.ObjectId(userId);
    const user = await this.userModel.findOneAndUpdate(
      { _id: uid, isDeleted: false },
      { $set: { status: 'ACTIVE' } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');

    // Also update Tenant verification status if applicable
    await this.tenantModel.updateMany(
      { userId: uid, isDeleted: false },
      { $set: { 'verificationStatus.aadhaar': 'VERIFIED' } },
    );

    // Update documents status
    await this.docModel.updateMany(
      { uploadedBy: uid, isDeleted: false },
      { $set: { status: 'APPROVED' } },
    );

    await this.auditService.log(adminId, 'KYC_APPROVED', 'User', userId, { status: user.status }, { status: 'ACTIVE' });

    // Send notification to user
    await this.notificationsService.create(
      userId,
      NotificationType.GENERAL,
      'KYC Verified Successfully',
      'Your KYC verification has been reviewed and approved by the RentFlow team.',
    ).catch(() => { });

    return { data: { success: true, message: 'KYC verified and approved' } };
  }

  async rejectKyc(userId: string, adminId: string, reason?: string) {
    const uid = new Types.ObjectId(userId);
    const user = await this.userModel.findOneAndUpdate(
      { _id: uid, isDeleted: false },
      { $set: { status: 'PENDING_VERIFICATION' } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');

    // Update Tenant verification status
    await this.tenantModel.updateMany(
      { userId: uid, isDeleted: false },
      { $set: { 'verificationStatus.aadhaar': 'REJECTED' } },
    );

    await this.auditService.log(adminId, 'KYC_REJECTED', 'User', userId, {}, { reason: reason || 'Document rejected' }, 'WARNING');

    // Send notification with rejection reason
    const msg = reason?.trim()
      ? `Your KYC submission was rejected: ${reason.trim()}. Please resubmit with clear documents.`
      : 'Your KYC submission was rejected. Please re-upload clear government-issued IDs.';

    await this.notificationsService.create(
      userId,
      NotificationType.GENERAL,
      'KYC Verification Requires Action',
      msg,
    ).catch(() => { });

    return { data: { success: true, message: 'KYC rejected' } };
  }
}
