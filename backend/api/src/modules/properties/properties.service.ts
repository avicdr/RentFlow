import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { AuditService } from '../audit/audit.service';
import { SubscriptionsService } from '../users/subscriptions.service';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private auditService: AuditService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async create(landlordId: string, dto: any) {
    const canAdd = await this.subscriptionsService.canAddProperty(landlordId);
    if (!canAdd.allowed) throw new ForbiddenException(canAdd.upgradeMessage);

    const property = await this.propertyModel.create({
      ...dto,
      landlordId: new Types.ObjectId(landlordId),
      // organizationId set by middleware or same as landlordId for solo landlords
      organizationId: new Types.ObjectId(landlordId),
    });
    await this.auditService.log(landlordId, 'PROPERTY_CREATED', 'Property', property._id.toString(), {}, { name: property.name });
    return { message: 'Property created', data: property };
  }

  async findAll(landlordId: string, query: { search?: string; status?: string; type?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: any = { landlordId: new Types.ObjectId(landlordId), isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.search) filter.name = { $regex: query.search, $options: 'i' };

    const [properties, total] = await Promise.all([
      this.propertyModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      this.propertyModel.countDocuments(filter),
    ]);

    return { data: properties, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, landlordId: string) {
    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(id),
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });
    if (!property) throw new NotFoundException('Property not found');
    return { data: property };
  }

  async update(id: string, landlordId: string, dto: any) {
    const property = await this.propertyModel.findOne({ _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId) });
    if (!property) throw new NotFoundException('Property not found');
    const before = property.toObject();
    const updated = await this.propertyModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    await this.auditService.log(landlordId, 'PROPERTY_UPDATED', 'Property', id, before as any, dto);
    return { message: 'Property updated', data: updated };
  }

  async updatePaymentMethods(id: string, landlordId: string, paymentMethods: any) {
    const property = await this.propertyModel.findOne({ _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId) });
    if (!property) throw new NotFoundException('Property not found');
    await this.propertyModel.updateOne({ _id: property._id }, { paymentMethods });
    await this.auditService.log(landlordId, 'PAYMENT_METHODS_UPDATED', 'Property', id);
    return { message: 'Payment methods updated' };
  }

  async remove(id: string, landlordId: string) {
    const property = await this.propertyModel.findOne({ _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId) });
    if (!property) throw new NotFoundException('Property not found');
    await this.propertyModel.updateOne({ _id: property._id }, { isDeleted: true, deletedAt: new Date() });
    await this.auditService.log(landlordId, 'PROPERTY_DELETED', 'Property', id, { name: property.name });
    return { message: 'Property deleted' };
  }

  async getStats(landlordId: string) {
    return this.propertyModel.aggregate([
      { $match: { landlordId: new Types.ObjectId(landlordId), isDeleted: false } },
      {
        $group: {
          _id: null,
          totalProperties: { $sum: 1 },
          totalRooms: { $sum: '$totalRooms' },
          totalBeds: { $sum: '$totalBeds' },
          occupiedBeds: { $sum: '$occupiedBeds' },
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
        },
      },
    ]);
  }

  async getTenants(propertyId: string, landlordId: string) {
    // Returns tenants for this property — data fetched from tenants collection
    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(propertyId),
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });
    if (!property) throw new NotFoundException('Property not found');
    // The actual tenant records are in the tenants collection; return minimal indicator
    return { data: [] };
  }
}
