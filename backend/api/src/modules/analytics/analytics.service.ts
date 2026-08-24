import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment } from '../payments/schemas/payment.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { Property } from '../properties/schemas/property.schema';
import { Complaint } from '../complaints/schemas/complaint.schema';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<any>,
    @InjectModel(Tenant.name) private tenantModel: Model<any>,
    @InjectModel(Property.name) private propertyModel: Model<any>,
    @InjectModel(Complaint.name) private complaintModel: Model<any>,
  ) {}

  async getLandlordDashboard(landlordId: string) {
    const lid = new Types.ObjectId(landlordId);
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);

    const [
      propertyStats,
      activeTenants,
      openComplaints,
      thisMonthPayments,
      revenueChart,
    ] = await Promise.all([
      this.propertyModel.aggregate([
        { $match: { landlordId: lid, isDeleted: false } },
        { $group: { _id: null, total: { $sum: 1 }, totalBeds: { $sum: '$totalBeds' }, occupiedBeds: { $sum: '$occupiedBeds' } } },
      ]),
      this.tenantModel.countDocuments({ landlordId: lid, status: 'ACTIVE', isDeleted: false }),
      this.complaintModel.countDocuments({ landlordId: lid, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      this.paymentModel.aggregate([
        {
          $match: {
            landlordId: lid,
            dueDate: { $gte: startOfThisMonth, $lte: endOfThisMonth },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: null,
            totalDue: { $sum: '$amount' },
            collected: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
            pendingCount: { $sum: { $cond: [{ $in: ['$status', ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW']] }, 1, 0] } },
            paidCount: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
          },
        },
      ]),
      // Last 6 months revenue
      Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const d = subMonths(now, 5 - i);
          const start = startOfMonth(d);
          const end = endOfMonth(d);
          return this.paymentModel.aggregate([
            { $match: { landlordId: lid, dueDate: { $gte: start, $lte: end }, status: 'PAID' } },
            { $group: { _id: null, collected: { $sum: '$amount' }, count: { $sum: 1 } } },
          ]).then(res => ({
            month: format(d, 'MMM yy'),
            collected: res[0]?.collected ?? 0,
            count: res[0]?.count ?? 0,
          }));
        }),
      ),
    ]);

    const ps = propertyStats[0] ?? {};
    const mp = thisMonthPayments[0] ?? {};

    return {
      totalProperties: ps.total ?? 0,
      totalBeds: ps.totalBeds ?? 0,
      occupiedBeds: ps.occupiedBeds ?? 0,
      occupancyRate: ps.totalBeds > 0 ? Math.round((ps.occupiedBeds / ps.totalBeds) * 100) : 0,
      activeTenants,
      openComplaints,
      totalDueThisMonth: mp.totalDue ?? 0,
      collectedThisMonth: mp.collected ?? 0,
      pendingPayments: mp.pendingCount ?? 0,
      paidPayments: mp.paidCount ?? 0,
      collectionRate: mp.totalDue > 0 ? Math.round((mp.collected / mp.totalDue) * 100) : 0,
      revenueChart,
    };
  }

  async getComplaintStats(landlordId: string) {
    const lid = new Types.ObjectId(landlordId);
    return this.complaintModel.aggregate([
      { $match: { landlordId: lid } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  async getTenantPaymentHealth(landlordId: string) {
    const lid = new Types.ObjectId(landlordId);
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();

    return this.paymentModel.aggregate([
      { $match: { landlordId: lid, month: thisMonth, year: thisYear, isDeleted: false } },
      { $lookup: { from: 'tenants', localField: 'tenantId', foreignField: '_id', as: 'tenant' } },
      { $unwind: '$tenant' },
      { $lookup: { from: 'users', localField: 'tenant.userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          status: 1, amount: 1, dueDate: 1, paidAt: 1,
          tenantName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          isLate: { $and: [{ $gt: ['$paidAt', '$dueDate'] }, { $eq: ['$status', 'PAID'] }] },
        },
      },
      { $sort: { dueDate: 1 } },
    ]);
  }
}
