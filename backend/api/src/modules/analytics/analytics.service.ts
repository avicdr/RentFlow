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
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    const [
      propertyStats,
      activeTenants,
      openComplaints,
      thisMonthPayments,
      lastMonthPayments,
      revenueChart,
      propertyPerformance,
      tenantPaymentHealth,
    ] = await Promise.all([
      // ── Overall property stats ──
      this.propertyModel.aggregate([
        { $match: { landlordId: lid, isDeleted: false } },
        { $group: { _id: null, total: { $sum: 1 }, totalBeds: { $sum: '$totalBeds' }, occupiedBeds: { $sum: '$occupiedBeds' } } },
      ]),

      this.tenantModel.countDocuments({ landlordId: lid, status: 'ACTIVE', isDeleted: false }),

      this.complaintModel.countDocuments({ landlordId: lid, status: { $in: ['OPEN', 'IN_PROGRESS'] } }),

      // ── This month payments aggregate ──
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

      // ── Last month collected (for revenue growth %) ──
      this.paymentModel.aggregate([
        {
          $match: {
            landlordId: lid,
            dueDate: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            status: 'PAID',
            isDeleted: false,
          },
        },
        { $group: { _id: null, collected: { $sum: '$amount' } } },
      ]),

      // ── Last 6 months revenue chart ──
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

      // ── Property-wise performance ──
      // Per-property: occupancy from properties collection, revenue + collection from payments,
      // open complaints count from complaints collection.
      (async () => {
        const properties = await this.propertyModel.find(
          { landlordId: lid, isDeleted: false },
          { _id: 1, name: 1, totalBeds: 1, occupiedBeds: 1 },
        ).lean();

        if (properties.length === 0) return [];

        const propertyIds = properties.map((p: any) => p._id);

        // Revenue + collection rate per property this month
        const paymentsByProp = await this.paymentModel.aggregate([
          {
            $match: {
              landlordId: lid,
              propertyId: { $in: propertyIds },
              dueDate: { $gte: startOfThisMonth, $lte: endOfThisMonth },
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: '$propertyId',
              totalDue: { $sum: '$amount' },
              collected: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
            },
          },
        ]);

        // Open complaints per property
        const complaintsByProp = await this.complaintModel.aggregate([
          {
            $match: {
              landlordId: lid,
              propertyId: { $in: propertyIds },
              status: { $in: ['OPEN', 'IN_PROGRESS'] },
            },
          },
          { $group: { _id: '$propertyId', count: { $sum: 1 } } },
        ]);

        const paymentMap = new Map(paymentsByProp.map((p: any) => [p._id.toString(), p]));
        const complaintMap = new Map(complaintsByProp.map((c: any) => [c._id.toString(), c.count]));

        return properties.map((prop: any) => {
          const pid = prop._id.toString();
          const pay = paymentMap.get(pid) ?? { totalDue: 0, collected: 0 };
          return {
            propertyId: pid,
            name: prop.name,
            totalBeds: prop.totalBeds ?? 0,
            occupiedBeds: prop.occupiedBeds ?? 0,
            occupancyRate: prop.totalBeds > 0
              ? Math.round((prop.occupiedBeds / prop.totalBeds) * 100)
              : 0,
            revenue: pay.collected,
            collectionRate: pay.totalDue > 0
              ? Math.round((pay.collected / pay.totalDue) * 100)
              : 0,
            openComplaints: complaintMap.get(pid) ?? 0,
          };
        });
      })(),

      // ── Tenant payment health ──
      // Per-tenant: count of paid / pending / overdue payments this month + payment rate %
      (async () => {
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();

        const raw = await this.paymentModel.aggregate([
          {
            $match: {
              landlordId: lid,
              month: thisMonth,
              year: thisYear,
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: '$tenantId',
              total: { $sum: 1 },
              paid: {
                $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] },
              },
              pending: {
                $sum: {
                  $cond: [
                    { $in: ['$status', ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW']] },
                    1,
                    0,
                  ],
                },
              },
              overdue: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $in: ['$status', ['PENDING', 'REJECTED']] },
                        { $lt: ['$dueDate', now] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          // Resolve tenant → user to get full name
          { $lookup: { from: 'tenants', localField: '_id', foreignField: '_id', as: 'tenant' } },
          { $unwind: '$tenant' },
          { $lookup: { from: 'users', localField: 'tenant.userId', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          {
            $project: {
              tenantId: '$_id',
              name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
              paid: 1,
              pending: 1,
              overdue: 1,
              total: 1,
              paymentRate: {
                $cond: [
                  { $gt: ['$total', 0] },
                  { $round: [{ $multiply: [{ $divide: ['$paid', '$total'] }, 100] }, 0] },
                  0,
                ],
              },
            },
          },
          { $sort: { paymentRate: 1 } }, // worst payers first
        ]);

        return raw;
      })(),
    ]);

    const ps = propertyStats[0] ?? {};
    const mp = thisMonthPayments[0] ?? {};
    const lm = lastMonthPayments[0] ?? {};

    const collectedThisMonth = mp.collected ?? 0;
    const collectedLastMonth = lm.collected ?? 0;
    const revenueGrowthPct =
      collectedLastMonth > 0
        ? Math.round(((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100)
        : collectedThisMonth > 0
          ? 100
          : 0;

    return {
      totalProperties: ps.total ?? 0,
      totalBeds: ps.totalBeds ?? 0,
      occupiedBeds: ps.occupiedBeds ?? 0,
      occupancyRate: ps.totalBeds > 0 ? Math.round((ps.occupiedBeds / ps.totalBeds) * 100) : 0,
      activeTenants,
      openComplaints,
      totalDueThisMonth: mp.totalDue ?? 0,
      totalRevenueThisMonth: collectedThisMonth,
      collectedThisMonth,
      pendingPayments: mp.pendingCount ?? 0,
      paidPayments: mp.paidCount ?? 0,
      collectionRate: mp.totalDue > 0 ? Math.round((mp.collected / mp.totalDue) * 100) : 0,
      revenueGrowthPct,
      revenueChart,
      propertyPerformance,
      tenantPaymentHealth,
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
