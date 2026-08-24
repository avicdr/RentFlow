import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class LeasesService {
  constructor(@InjectModel('Lease') private leaseModel: Model<any>) {}

  async create(data: any, landlordId: string) {
    // Whitelist the fields a landlord may set — never spread the raw body (would allow
    // injecting status/isDeleted/signedBy/landlordId).
    if (!data.tenantId || !data.userId || !data.propertyId)
      throw new BadRequestException('tenantId, userId and propertyId are required');
    for (const key of ['tenantId', 'userId', 'propertyId', 'roomId']) {
      if (data[key] && !Types.ObjectId.isValid(data[key]))
        throw new BadRequestException(`Invalid ${key}`);
    }
    return this.leaseModel.create({
      tenantId: new Types.ObjectId(data.tenantId),
      userId: new Types.ObjectId(data.userId),
      propertyId: new Types.ObjectId(data.propertyId),
      roomId: data.roomId ? new Types.ObjectId(data.roomId) : undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyRent: data.monthlyRent,
      securityDeposit: data.securityDeposit,
      noticePeriodDays: data.noticePeriodDays,
      terms: data.terms,
      specialClauses: data.specialClauses,
      landlordId: new Types.ObjectId(landlordId),
      status: 'DRAFT',
    });
  }

  async findByTenant(tenantId: string) {
    return this.leaseModel
      .find({ tenantId, isDeleted: false })
      .populate('propertyId', 'name address')
      .populate('landlordId', 'firstName lastName phone email')
      .sort({ createdAt: -1 });
  }

  async findByLandlord(landlordId: string, query: any = {}) {
    const filter: any = { landlordId: new Types.ObjectId(landlordId), isDeleted: false };
    if (query.status) filter.status = query.status;
    if (query.propertyId && Types.ObjectId.isValid(query.propertyId))
      filter.propertyId = new Types.ObjectId(query.propertyId);
    return this.leaseModel
      .find(filter)
      .populate('tenantId', 'userId')
      .populate('propertyId', 'name')
      .sort({ createdAt: -1 });
  }

  async findById(id: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Lease not found');
    const lease = await this.leaseModel
      .findById(id)
      .populate('propertyId', 'name address paymentMethods')
      .populate('landlordId', 'firstName lastName phone email')
      .populate('tenantId');
    if (!lease || lease.isDeleted) throw new NotFoundException('Lease not found');
    this.assertCanAccess(lease, userId, role);
    return lease;
  }

  // Landlords/PMs may only touch their own leases; tenants only their own (by userId).
  private assertCanAccess(lease: any, userId: string, role: string) {
    if (role === 'SUPER_ADMIN') return;
    const landlordId = (lease.landlordId as any)?._id?.toString() ?? lease.landlordId?.toString();
    const leaseUserId = (lease.userId as any)?._id?.toString() ?? lease.userId?.toString();
    if (role === 'LANDLORD' || role === 'PROPERTY_MANAGER') {
      if (landlordId !== userId) throw new ForbiddenException('Access denied');
    } else if (role === 'TENANT') {
      if (leaseUserId !== userId) throw new ForbiddenException('Access denied');
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // Build a query that scopes to the owning landlord unless the caller is a platform admin.
  private ownerScope(id: string, userId: string, role: string) {
    const q: any = { _id: new Types.ObjectId(id), isDeleted: false };
    if (role !== 'SUPER_ADMIN') q.landlordId = new Types.ObjectId(userId);
    return q;
  }

  async activate(id: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Lease not found');
    const lease = await this.leaseModel.findOneAndUpdate(
      this.ownerScope(id, userId, role),
      { status: 'ACTIVE', signedAt: new Date() },
      { new: true },
    );
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async attachDocument(id: string, userId: string, role: string, documentPath: string) {
    if (!documentPath || typeof documentPath !== 'string')
      throw new BadRequestException('documentPath is required');
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Lease not found');

    // Verify ownership before mutating (landlord owns it, or tenant on the lease).
    const existing = await this.leaseModel.findById(id);
    if (!existing || existing.isDeleted) throw new NotFoundException('Lease not found');
    this.assertCanAccess(existing, userId, role);

    return this.leaseModel.findByIdAndUpdate(id, { documentPath }, { new: true });
  }

  async terminate(id: string, userId: string, role: string, reason: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Lease not found');
    // Store the reason in dedicated fields — do NOT clobber the lease `terms`.
    const lease = await this.leaseModel.findOneAndUpdate(
      this.ownerScope(id, userId, role),
      { status: 'TERMINATED', terminatedAt: new Date(), terminationReason: reason ?? '' },
      { new: true },
    );
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async getActiveLease(userId: string) {
    // Leases key the tenant's user via `userId` (tenantId references the Tenant record).
    return this.leaseModel
      .findOne({ userId: new Types.ObjectId(userId), status: 'ACTIVE', isDeleted: false })
      .populate('propertyId', 'name address paymentMethods')
      .populate('landlordId', 'firstName lastName phone email');
  }
}
