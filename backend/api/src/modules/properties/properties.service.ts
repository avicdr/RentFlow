import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { AuditService } from '../audit/audit.service';
import { SubscriptionsService } from '../users/subscriptions.service';
import { RoomsService } from '../rooms/rooms.module';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private auditService: AuditService,
    private subscriptionsService: SubscriptionsService,
    private roomsService: RoomsService,
  ) { }

  private async generateUniqueSlug(name: string, city: string, excludeId?: string): Promise<string> {
    const base = slugify(`${name}-${city || 'property'}`);
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.propertyModel.findOne({
        slug,
        ...(excludeId ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
      });
      if (!existing) break;
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  async create(landlordId: string, dto: any) {
    // Properties are unlimited — subscription limits apply to rental units (rooms), not properties.
    const slug = await this.generateUniqueSlug(dto.name, dto.address?.city || '');

    const property = await this.propertyModel.create({
      ...dto,
      slug,
      listingStatus: dto.listingStatus || 'DRAFT',
      landlordId: new Types.ObjectId(landlordId),
      organizationId: new Types.ObjectId(landlordId),
    });
    await this.auditService.log(landlordId, 'PROPERTY_CREATED', 'Property', property._id.toString(), {}, { name: property.name, slug });
    return { message: 'Property created', data: property };
  }

  async findAll(landlordId: string, query: { search?: string; status?: string; listingStatus?: string; type?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: any = { landlordId: new Types.ObjectId(landlordId), isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.listingStatus) filter.listingStatus = query.listingStatus;
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

    const updatePayload: any = { ...dto };
    // If name or city changed and no explicit slug provided, re-generate slug if needed
    if ((dto.name && dto.name !== property.name) || (dto.address?.city && dto.address.city !== property.address?.city)) {
      if (!dto.slug) {
        updatePayload.slug = await this.generateUniqueSlug(dto.name || property.name, dto.address?.city || property.address?.city || '', id);
      }
    }

    const before = property.toObject();
    const updated = await this.propertyModel.findByIdAndUpdate(id, { $set: updatePayload }, { new: true });
    await this.auditService.log(landlordId, 'PROPERTY_UPDATED', 'Property', id, before as any, updatePayload);
    return { message: 'Property updated', data: updated };
  }

  async publish(id: string, landlordId: string) {
    const property = await this.propertyModel.findOne({ _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId), isDeleted: false });
    if (!property) throw new NotFoundException('Property not found');

    // Validation for publishing
    if (!property.name || !property.type || !property.address?.city || !property.address?.line1) {
      throw new BadRequestException('Property must have a name, type, and full address before publishing');
    }

    const rooms = await this.roomsService.findByProperty(id, landlordId, 'LANDLORD');
    if (!rooms || rooms.length === 0) {
      throw new BadRequestException('Property must have at least one room before publishing');
    }

    let slug = property.slug;
    if (!slug) {
      slug = await this.generateUniqueSlug(property.name, property.address.city, id);
    }

    const updated = await this.propertyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          slug,
          listingStatus: 'PUBLISHED',
          isListed: true,
          status: 'ACTIVE',
          publishedAt: new Date(),
        },
      },
      { new: true },
    );

    await this.auditService.log(landlordId, 'PROPERTY_PUBLISHED', 'Property', id, {}, { slug, publishedAt: new Date() });
    return { message: 'Property published to RentFlow marketplace & shareable page', data: updated };
  }

  async unpublish(id: string, landlordId: string) {
    const property = await this.propertyModel.findOne({ _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId), isDeleted: false });
    if (!property) throw new NotFoundException('Property not found');

    const updated = await this.propertyModel.findByIdAndUpdate(
      id,
      {
        $set: {
          listingStatus: 'UNPUBLISHED',
          isListed: false,
          unpublishedAt: new Date(),
        },
      },
      { new: true },
    );

    await this.auditService.log(landlordId, 'PROPERTY_UNPUBLISHED', 'Property', id, {}, { unpublishedAt: new Date() });
    return { message: 'Property unpublished', data: updated };
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
          publishedCount: { $sum: { $cond: [{ $eq: ['$listingStatus', 'PUBLISHED'] }, 1, 0] } },
        },
      },
    ]);
  }

  async getTenants(propertyId: string, landlordId: string) {
    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(propertyId),
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });
    if (!property) throw new NotFoundException('Property not found');
    return { data: [] };
  }
}
