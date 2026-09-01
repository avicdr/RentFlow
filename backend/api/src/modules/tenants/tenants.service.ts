import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { User, UserDocument, UserRole, UserStatus } from '../users/schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../notifications/mail.service';
import { AuditService } from '../audit/audit.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { RoomsService } from '../rooms/rooms.module';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
    private mailService: MailService,
    private auditService: AuditService,
    private roomsService: RoomsService,
  ) {}

  private async assertTenantAccess(tenant: TenantDocument, userId: string, role: string, requiredPermission?: string) {
    if (role === 'SUPER_ADMIN') return;
    if (role === 'LANDLORD') {
      if (tenant.landlordId.toString() !== userId) {
        throw new ForbiddenException('This tenant does not belong to your properties');
      }
      return;
    }
    if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.tenantModel.db.model('PropertyManagerAssignment');
      const assignment = await assignmentModel.findOne({
        userId: new Types.ObjectId(userId),
        propertyId: (tenant.propertyId as any)?._id || tenant.propertyId,
        status: 'ACTIVE',
        isDeleted: false,
      });
      if (!assignment) {
        throw new ForbiddenException('You do not have access to this tenant');
      }
      if (requiredPermission && (assignment as any).permissions && !(assignment as any).permissions[requiredPermission]) {
        throw new ForbiddenException(`You do not have permission (${requiredPermission}) on this property`);
      }
      return;
    }
    throw new ForbiddenException('Access denied');
  }

  async create(userId: string, role = 'LANDLORD', dto: any) {
    if (!dto.propertyId || !Types.ObjectId.isValid(dto.propertyId)) {
      throw new BadRequestException('Valid propertyId is required');
    }

    const propModel = this.tenantModel.db.model('Property');
    const property = await propModel.findOne({ _id: new Types.ObjectId(dto.propertyId), isDeleted: false });
    if (!property) throw new NotFoundException('Property not found');

    if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.tenantModel.db.model('PropertyManagerAssignment');
      const assignment = await assignmentModel.findOne({
        userId: new Types.ObjectId(userId),
        propertyId: property._id,
        status: 'ACTIVE',
        isDeleted: false,
      });
      if (!assignment) {
        throw new ForbiddenException('You are not assigned as Property Manager for this property');
      }
      if (assignment.permissions && !assignment.permissions.manageTenants) {
        throw new ForbiddenException('You do not have permission to add tenants to this property');
      }
    } else if (role !== 'SUPER_ADMIN' && property.landlordId.toString() !== userId) {
      throw new ForbiddenException('You do not own this property');
    }

    const landlordId = property.landlordId;

    // Check for existing user with this email
    let tenantUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });

    if (tenantUser) {
      if (tenantUser.role !== UserRole.TENANT && tenantUser.role !== UserRole.PROPERTY_MANAGER)
        throw new BadRequestException('A user with this email exists with a different role');
      const existingTenant = await this.tenantModel.findOne({ userId: tenantUser._id, isDeleted: false });
      if (existingTenant) throw new ConflictException('This user is already a tenant');
    } else {
      // Auto-create user account for tenant
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });
      tenantUser = await this.userModel.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        role: UserRole.TENANT,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });
    }

    const tenant = await this.tenantModel.create({
      userId: tenantUser._id,
      landlordId,
      organizationId: property.organizationId || landlordId,
      propertyId: property._id,
      roomId: new Types.ObjectId(dto.roomId),
      bedId: dto.bedId ? new Types.ObjectId(dto.bedId) : null,
      joiningDate: new Date(dto.joiningDate),
      agreedRent: dto.agreedRent,
      securityDeposit: dto.securityDeposit,
      rentDueDay: dto.rentDueDay ?? 5,
      emergencyContact: dto.emergencyContact ?? {},
      referredBy: dto.referredBy ? new Types.ObjectId(dto.referredBy) : null,
    });

    await this.notificationsService.create(
      tenantUser._id, NotificationType.GENERAL,
      'Welcome to RentFlow!',
      'Your landlord has added you to RentFlow. Login to manage your rent payments.',
    );

    await this.auditService.log(userId, 'TENANT_ONBOARDED', 'Tenant', tenant._id.toString(), {}, {
      tenantEmail: dto.email, propertyId: dto.propertyId,
    });

    // Sync room occupancy counters now that a new tenant is placed in the room
    if (dto.roomId) await this.roomsService.syncRoomOccupancy(dto.roomId);

    return { message: 'Tenant added successfully', data: { tenant, tenantUser: { id: tenantUser._id, email: tenantUser.email } } };
  }

  async findAll(userId: string, query: any) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: any = { isDeleted: false };

    if (query.role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.tenantModel.db.model('PropertyManagerAssignment');
      const assignments = await assignmentModel.find({
        userId: new Types.ObjectId(userId),
        status: 'ACTIVE',
        isDeleted: false,
      }).select('propertyId');
      const assignedPropIds = assignments.map((a: any) => a.propertyId);

      if (query.propertyId) {
        const matches = assignedPropIds.some((p: any) => p.toString() === query.propertyId);
        if (!matches) throw new ForbiddenException('You do not have access to this property');
        filter.propertyId = new Types.ObjectId(query.propertyId);
      } else {
        filter.propertyId = { $in: assignedPropIds };
      }
    } else if (query.role !== 'SUPER_ADMIN') {
      filter.landlordId = new Types.ObjectId(userId);
      if (query.propertyId) filter.propertyId = new Types.ObjectId(query.propertyId);
    }

    if (query.status) filter.status = query.status;

    const [tenants, total] = await Promise.all([
      this.tenantModel
        .find(filter)
        .populate('userId', 'firstName lastName email phone status profile')
        .populate('propertyId', 'name address type')
        .populate('roomId', 'roomNumber type monthlyRent')
        .populate('landlordId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.tenantModel.countDocuments(filter),
    ]);

    return { data: tenants, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role = 'LANDLORD') {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Tenant not found');
    const oid = new Types.ObjectId(id);

    let tenant = await this.tenantModel
      .findOne({ _id: oid, isDeleted: false })
      .populate('userId', 'firstName lastName email phone profile status isEmailVerified isPhoneVerified')
      .populate('propertyId', 'name address type paymentMethods')
      .populate('roomId', 'roomNumber type monthlyRent')
      .populate('bedId', 'bedNumber')
      .populate('landlordId', 'firstName lastName email phone');

    if (!tenant) {
      tenant = await this.tenantModel
        .findOne({ userId: oid, isDeleted: false })
        .populate('userId', 'firstName lastName email phone profile status isEmailVerified isPhoneVerified')
        .populate('propertyId', 'name address type paymentMethods')
        .populate('roomId', 'roomNumber type monthlyRent')
        .populate('bedId', 'bedNumber')
        .populate('landlordId', 'firstName lastName email phone');
    }

    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.assertTenantAccess(tenant, userId, role, 'viewTenants');
    return { data: tenant };
  }

  async getStayHistory(id: string, userId: string, role = 'LANDLORD') {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Tenant record not found');
    const oid = new Types.ObjectId(id);

    let resolvedUserId = oid;
    const tenantRec = await this.tenantModel.findById(oid);
    if (tenantRec) {
      await this.assertTenantAccess(tenantRec, userId, role, 'viewTenants');
      resolvedUserId = tenantRec.userId;
    }

    const filter: any = { userId: resolvedUserId, isDeleted: false };
    const stays = await this.tenantModel
      .find(filter)
      .populate('propertyId', 'name address type city state')
      .populate('roomId', 'roomNumber type monthlyRent')
      .populate('landlordId', 'firstName lastName email phone')
      .sort({ joiningDate: -1 })
      .lean();

    return { data: stays };
  }

  async findByUser(userId: string) {
    const tenant = await this.tenantModel
      .findOne({ userId: new Types.ObjectId(userId), isDeleted: false })
      .populate('propertyId', 'name address type paymentMethods')
      .populate('roomId', 'roomNumber type monthlyRent')
      .populate('landlordId', 'firstName lastName phone email');
    if (!tenant) throw new NotFoundException('Tenant record not found');
    return { data: tenant };
  }

  async update(id: string, userId: string, role: string, dto: any) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Tenant not found');
    const tenant = await this.tenantModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.assertTenantAccess(tenant, userId, role, 'manageTenants');

    await this.tenantModel.updateOne({ _id: tenant._id }, { $set: dto });
    await this.auditService.log(userId, 'TENANT_UPDATED', 'Tenant', id, {}, dto);
    return { message: 'Tenant updated' };
  }

  async vacate(id: string, userId: string, role: string, vacatingDate: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Tenant not found');
    const tenant = await this.tenantModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.assertTenantAccess(tenant, userId, role, 'manageTenants');

    await this.tenantModel.updateOne({ _id: tenant._id }, {
      status: 'VACATED', vacatingDate: new Date(vacatingDate),
    });
    await this.auditService.log(userId, 'TENANT_VACATED', 'Tenant', id, { status: 'ACTIVE' }, { status: 'VACATED', vacatingDate });

    if (tenant.roomId) await this.roomsService.syncRoomOccupancy(tenant.roomId);

    return { message: 'Tenant marked as vacated' };
  }

  async getPaymentHistory(tenantId: string, userId: string, role = 'LANDLORD') {
    if (!Types.ObjectId.isValid(tenantId)) throw new NotFoundException('Tenant not found');
    const tenant = await this.tenantModel.findOne({ _id: new Types.ObjectId(tenantId), isDeleted: false });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.assertTenantAccess(tenant, userId, role, 'viewPayments');
    return { data: { tenantId, message: 'Use /payments?tenantId= for payment history' } };
  }
}

