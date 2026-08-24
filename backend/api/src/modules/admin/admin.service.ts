import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Property') private propertyModel: Model<any>,
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Complaint') private complaintModel: Model<any>,
    @InjectModel('Organization') private orgModel: Model<any>,
    private auditService: AuditService,
  ) {}

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

    const TIER_PRICES: Record<string, number> = { SOLO: 499, GROWTH: 1499, SCALE: 2999, ENTERPRISE: 4999 };
    const tierMap: Record<string, number> = {};
    let mrr = 0;
    for (const t of subscriptionBreakdown) {
      tierMap[t._id] = t.count;
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
}
