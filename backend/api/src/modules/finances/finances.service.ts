import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PropertyExpense, PropertyExpenseDocument } from './schemas/expense.schema';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear } from 'date-fns';

@Injectable()
export class FinancesService {
  constructor(
    @InjectModel(PropertyExpense.name)
    private expenseModel: Model<PropertyExpenseDocument>,
    @InjectModel('Property') private propertyModel: Model<any>,
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
  ) {}

  // ── Expenses CRUD ──────────────────────────────────────────
  async createExpense(landlordId: string, dto: CreateExpenseDto) {
    const lid = new Types.ObjectId(landlordId);
    const pid = new Types.ObjectId(dto.propertyId);

    const property = await this.propertyModel.findOne({ _id: pid, landlordId: lid, isDeleted: false });
    if (!property) throw new NotFoundException('Property not found');

    const expense = await this.expenseModel.create({
      landlordId: lid,
      propertyId: pid,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : null,
      category: dto.category,
      amount: dto.amount,
      date: new Date(dto.date),
      description: dto.description ?? '',
      receiptUrl: dto.receiptUrl ?? '',
      isRecurring: dto.isRecurring ?? false,
      recurringInterval: dto.recurringInterval ?? null,
    });

    return { message: 'Expense recorded successfully', data: expense };
  }

  async getExpenses(landlordId: string, query: any) {
    const lid = new Types.ObjectId(landlordId);
    const page = Math.max(1, +(query.page ?? 1));
    const limit = Math.min(100, +(query.limit ?? 20));

    const filter: any = { landlordId: lid, isDeleted: false };
    if (query.propertyId) filter.propertyId = new Types.ObjectId(query.propertyId);
    if (query.category) filter.category = query.category;
    if (query.startDate && query.endDate) {
      filter.date = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
    }

    const [expenses, total] = await Promise.all([
      this.expenseModel
        .find(filter)
        .populate('propertyId', 'name address')
        .populate('roomId', 'roomNumber')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.expenseModel.countDocuments(filter),
    ]);

    return { data: expenses, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async deleteExpense(id: string, landlordId: string) {
    const expense = await this.expenseModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId), isDeleted: false },
      { $set: { isDeleted: true } },
    );
    if (!expense) throw new NotFoundException('Expense not found');
    return { message: 'Expense removed' };
  }

  // ── Portfolio Financial Intelligence Overview ───────────────
  async getPortfolioOverview(landlordId: string) {
    const lid = new Types.ObjectId(landlordId);
    const now = new Date();
    const startThisMonth = startOfMonth(now);
    const endThisMonth = endOfMonth(now);

    const [properties, thisMonthPayments, thisMonthExpenses, sixMonthCashflow, categoryExpenses] =
      await Promise.all([
        // Properties aggregated
        this.propertyModel.find({ landlordId: lid, isDeleted: false }).lean(),

        // Current month rent collection
        this.paymentModel.aggregate([
          {
            $match: {
              landlordId: lid,
              dueDate: { $gte: startThisMonth, $lte: endThisMonth },
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: null,
              expectedRent: { $sum: '$amount' },
              collectedRent: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
              pendingRent: {
                $sum: {
                  $cond: [{ $in: ['$status', ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW']] }, '$amount', 0],
                },
              },
            },
          },
        ]),

        // Current month expenses
        this.expenseModel.aggregate([
          {
            $match: {
              landlordId: lid,
              date: { $gte: startThisMonth, $lte: endThisMonth },
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: null,
              totalExpenses: { $sum: '$amount' },
            },
          },
        ]),

        // Last 6 months cashflow (Income vs Expense)
        Promise.all(
          Array.from({ length: 6 }, (_, i) => {
            const d = subMonths(now, 5 - i);
            const s = startOfMonth(d);
            const e = endOfMonth(d);
            return Promise.all([
              this.paymentModel.aggregate([
                { $match: { landlordId: lid, dueDate: { $gte: s, $lte: e }, status: 'PAID', isDeleted: false } },
                { $group: { _id: null, collected: { $sum: '$amount' } } },
              ]),
              this.expenseModel.aggregate([
                { $match: { landlordId: lid, date: { $gte: s, $lte: e }, isDeleted: false } },
                { $group: { _id: null, expenses: { $sum: '$amount' } } },
              ]),
            ]).then(([pay, exp]) => {
              const income = pay[0]?.collected ?? 0;
              const expense = exp[0]?.expenses ?? 0;
              return {
                month: format(d, 'MMM yy'),
                income,
                expenses: expense,
                netIncome: income - expense,
              };
            });
          }),
        ),

        // Expense breakdown by category for current month
        this.expenseModel.aggregate([
          {
            $match: {
              landlordId: lid,
              date: { $gte: startThisMonth, $lte: endThisMonth },
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const totalProps = properties.length;
    const totalBeds = properties.reduce((acc, p) => acc + (p.totalBeds || 0), 0);
    const occupiedBeds = properties.reduce((acc, p) => acc + (p.occupiedBeds || 0), 0);
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const pay = thisMonthPayments[0] ?? { expectedRent: 0, collectedRent: 0, pendingRent: 0 };
    const exp = thisMonthExpenses[0]?.totalExpenses ?? 0;
    const netMonthlyIncome = pay.collectedRent - exp;
    const collectionRate = pay.expectedRent > 0 ? Math.round((pay.collectedRent / pay.expectedRent) * 100) : 0;
    const projectedAnnualIncome = pay.collectedRent * 12;

    return {
      portfolioSummary: {
        totalProperties: totalProps,
        totalUnits: totalBeds,
        occupiedUnits: occupiedBeds,
        vacantUnits: vacantBeds,
        occupancyRate,
        expectedMonthlyRent: pay.expectedRent,
        collectedMonthlyRent: pay.collectedRent,
        pendingMonthlyRent: pay.pendingRent,
        monthlyExpenses: exp,
        netMonthlyIncome,
        collectionRate,
        projectedAnnualIncome,
      },
      cashflowChart: sixMonthCashflow,
      expensesByCategory: categoryExpenses.map(c => ({ category: c._id, total: c.total, count: c.count })),
    };
  }

  // ── Property-Level Financial Metrics ────────────────────────
  async getPropertyFinances(propertyId: string, landlordId: string) {
    const lid = new Types.ObjectId(landlordId);
    const pid = new Types.ObjectId(propertyId);
    const now = new Date();
    const startThisMonth = startOfMonth(now);
    const endThisMonth = endOfMonth(now);
    const startYear = startOfYear(now);
    const endYear = endOfYear(now);

    const property = await this.propertyModel.findOne({ _id: pid, landlordId: lid, isDeleted: false });
    if (!property) throw new NotFoundException('Property not found');

    const [allTimeRent, thisMonthRent, ytdExpenses, thisMonthExpenses, categoryExpenses] =
      await Promise.all([
        this.paymentModel.aggregate([
          { $match: { propertyId: pid, isDeleted: false } },
          {
            $group: {
              _id: null,
              totalCollected: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
              totalExpected: { $sum: '$amount' },
              totalOverdue: {
                $sum: {
                  $cond: [
                    { $and: [{ $in: ['$status', ['PENDING', 'REJECTED']] }, { $lt: ['$dueDate', now] }] },
                    '$amount',
                    0,
                  ],
                },
              },
            },
          },
        ]),

        this.paymentModel.aggregate([
          {
            $match: {
              propertyId: pid,
              dueDate: { $gte: startThisMonth, $lte: endThisMonth },
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: null,
              expected: { $sum: '$amount' },
              collected: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
              pending: {
                $sum: {
                  $cond: [{ $in: ['$status', ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW']] }, '$amount', 0],
                },
              },
            },
          },
        ]),

        this.expenseModel.aggregate([
          { $match: { propertyId: pid, date: { $gte: startYear, $lte: endYear }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),

        this.expenseModel.aggregate([
          { $match: { propertyId: pid, date: { $gte: startThisMonth, $lte: endThisMonth }, isDeleted: false } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),

        this.expenseModel.aggregate([
          { $match: { propertyId: pid, isDeleted: false } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);

    const allRent = allTimeRent[0] ?? { totalCollected: 0, totalExpected: 0, totalOverdue: 0 };
    const monthRent = thisMonthRent[0] ?? { expected: 0, collected: 0, pending: 0 };
    const monthExp = thisMonthExpenses[0]?.total ?? 0;
    const ytdExp = ytdExpenses[0]?.total ?? 0;

    const totalBeds = property.totalBeds || 0;
    const occupiedBeds = property.occupiedBeds || 0;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Estimate vacancy loss (average monthly rent per bed * vacant beds)
    const avgRentPerBed = totalBeds > 0 && monthRent.expected > 0 ? monthRent.expected / totalBeds : 8000;
    const estimatedVacancyLoss = Math.round(vacantBeds * avgRentPerBed);

    const grossMonthlyIncome = monthRent.collected;
    const netMonthlyIncome = grossMonthlyIncome - monthExp;
    const estimatedAnnualRevenue = grossMonthlyIncome * 12;

    return {
      property: {
        id: property._id,
        name: property.name,
        type: property.type,
        address: property.address,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        occupancyRate,
      },
      metrics: {
        rentCollectedThisMonth: monthRent.collected,
        expectedRentThisMonth: monthRent.expected,
        pendingRentThisMonth: monthRent.pending,
        totalOverdueRent: allRent.totalOverdue,
        totalCollectedAllTime: allRent.totalCollected,
        monthlyExpenses: monthExp,
        ytdExpenses: ytdExp,
        grossMonthlyIncome,
        netMonthlyIncome,
        estimatedVacancyLoss,
        estimatedAnnualRevenue,
      },
      categoryExpenses: categoryExpenses.map(c => ({ category: c._id, total: c.total, count: c.count })),
    };
  }

  // ── Accounting Reports (Monthly / Annual) ───────────────────
  async getAccountingReports(landlordId: string, query: { year?: number; month?: number }) {
    const lid = new Types.ObjectId(landlordId);
    const targetYear = query.year ?? new Date().getFullYear();
    const startY = new Date(targetYear, 0, 1);
    const endY = new Date(targetYear, 11, 31, 23, 59, 59);

    // Monthly breakdown for selected year
    const monthlyReports = await Promise.all(
      Array.from({ length: 12 }, async (_, m) => {
        const s = new Date(targetYear, m, 1);
        const e = endOfMonth(s);

        const [payRes, expRes] = await Promise.all([
          this.paymentModel.aggregate([
            { $match: { landlordId: lid, dueDate: { $gte: s, $lte: e }, isDeleted: false } },
            {
              $group: {
                _id: null,
                totalDue: { $sum: '$amount' },
                collected: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
                pending: { $sum: { $cond: [{ $ne: ['$status', 'PAID'] }, '$amount', 0] } },
              },
            },
          ]),
          this.expenseModel.aggregate([
            { $match: { landlordId: lid, date: { $gte: s, $lte: e }, isDeleted: false } },
            { $group: { _id: null, totalExpenses: { $sum: '$amount' } } },
          ]),
        ]);

        const income = payRes[0]?.collected ?? 0;
        const totalDue = payRes[0]?.totalDue ?? 0;
        const pending = payRes[0]?.pending ?? 0;
        const expenses = expRes[0]?.totalExpenses ?? 0;
        const netIncome = income - expenses;
        const collectionRate = totalDue > 0 ? Math.round((income / totalDue) * 100) : 0;

        return {
          month: format(s, 'MMMM'),
          monthIndex: m + 1,
          totalDue,
          collectedIncome: income,
          pendingAmount: pending,
          expenses,
          netIncome,
          collectionRate,
        };
      }),
    );

    const totalAnnualIncome = monthlyReports.reduce((acc, m) => acc + m.collectedIncome, 0);
    const totalAnnualExpenses = monthlyReports.reduce((acc, m) => acc + m.expenses, 0);
    const netAnnualIncome = totalAnnualIncome - totalAnnualExpenses;

    return {
      year: targetYear,
      annualSummary: {
        totalAnnualIncome,
        totalAnnualExpenses,
        netAnnualIncome,
      },
      monthlyReports,
    };
  }
}
