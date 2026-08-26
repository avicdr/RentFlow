import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UtilityBill, UtilityBillDocument, UtilityStatus } from './schemas/utility-bill.schema';
import { CreateUtilityBillDto, UpdateUtilityBillDto } from './dto/utility.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class UtilitiesService {
  constructor(
    @InjectModel(UtilityBill.name)
    private billModel: Model<UtilityBillDocument>,
    @InjectModel('Property') private propertyModel: Model<any>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
    private notificationsService: NotificationsService,
  ) {}

  async create(landlordId: string, dto: CreateUtilityBillDto) {
    const lid = new Types.ObjectId(landlordId);
    const pid = new Types.ObjectId(dto.propertyId);

    const property = await this.propertyModel.findOne({ _id: pid, landlordId: lid, isDeleted: false });
    if (!property) throw new NotFoundException('Property not found');

    const bill = await this.billModel.create({
      landlordId: lid,
      propertyId: pid,
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : null,
      tenantId: dto.tenantId ? new Types.ObjectId(dto.tenantId) : null,
      type: dto.type,
      amount: dto.amount,
      billingPeriod: dto.billingPeriod,
      dueDate: new Date(dto.dueDate),
      status: UtilityStatus.PENDING,
      documentUrl: dto.documentUrl ?? '',
      notes: dto.notes ?? '',
    });

    // Notify tenant if assigned to specific tenant
    if (dto.tenantId) {
      const tenant = await this.tenantModel.findById(dto.tenantId);
      if (tenant) {
        await this.notificationsService.create(
          tenant.userId,
          NotificationType.GENERAL,
          '💡 New Utility Bill Added',
          `A new ${dto.type.toLowerCase()} bill of ₹${dto.amount.toLocaleString('en-IN')} for ${dto.billingPeriod} has been issued.`,
          { billId: bill._id.toString() },
        );
      }
    }

    return { message: 'Utility bill issued successfully', data: bill };
  }

  async findAllForLandlord(landlordId: string, query: any) {
    const lid = new Types.ObjectId(landlordId);
    const page = Math.max(1, +(query.page ?? 1));
    const limit = Math.min(100, +(query.limit ?? 20));

    const filter: any = { landlordId: lid, isDeleted: false };
    if (query.propertyId) filter.propertyId = new Types.ObjectId(query.propertyId);
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const [bills, total] = await Promise.all([
      this.billModel
        .find(filter)
        .populate('propertyId', 'name address')
        .populate({ path: 'tenantId', populate: { path: 'userId', select: 'firstName lastName email' } })
        .populate('roomId', 'roomNumber')
        .sort({ dueDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.billModel.countDocuments(filter),
    ]);

    return { data: bills, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findMyBills(userId: string, query: any) {
    const uid = new Types.ObjectId(userId);
    const tenant = await this.tenantModel.findOne({ userId: uid, isDeleted: false });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const filter: any = {
      isDeleted: false,
      $or: [
        { tenantId: tenant._id },
        { propertyId: tenant.propertyId, tenantId: null },
      ],
    };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const bills = await this.billModel
      .find(filter)
      .populate('propertyId', 'name address')
      .populate('roomId', 'roomNumber')
      .sort({ dueDate: -1 })
      .lean();

    const pendingTotal = bills
      .filter((b: any) => b.status === UtilityStatus.PENDING || b.status === UtilityStatus.OVERDUE)
      .reduce((acc: number, b: any) => acc + (b.amount || 0), 0);

    const paidTotal = bills
      .filter((b: any) => b.status === UtilityStatus.PAID)
      .reduce((acc: number, b: any) => acc + (b.amount || 0), 0);

    return {
      data: bills,
      summary: {
        totalBills: bills.length,
        pendingAmount: pendingTotal,
        paidAmount: paidTotal,
      },
    };
  }

  async updateStatus(id: string, landlordId: string, dto: UpdateUtilityBillDto) {
    const lid = new Types.ObjectId(landlordId);
    const bill = await this.billModel.findOne({ _id: new Types.ObjectId(id), landlordId: lid, isDeleted: false });
    if (!bill) throw new NotFoundException('Bill not found');

    const updateData: any = {};
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === UtilityStatus.PAID) {
        updateData.paidAt = new Date();
      }
    }
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.billModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    return { message: 'Bill updated', data: updated };
  }

  async delete(id: string, landlordId: string) {
    const lid = new Types.ObjectId(landlordId);
    const bill = await this.billModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), landlordId: lid, isDeleted: false },
      { $set: { isDeleted: true } },
    );
    if (!bill) throw new NotFoundException('Bill not found');
    return { message: 'Bill deleted' };
  }
}
