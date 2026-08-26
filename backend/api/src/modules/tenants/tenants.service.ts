import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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

  async create(landlordId: string, dto: any) {
    // Check for existing user with this email
    let tenantUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });

    if (tenantUser) {
      if (tenantUser.role !== UserRole.TENANT)
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
      // Send welcome email with credentials
      // In production: send actual credentials or invite link
    }

    const tenant = await this.tenantModel.create({
      userId: tenantUser._id,
      landlordId: new Types.ObjectId(landlordId),
      organizationId: new Types.ObjectId(landlordId),
      propertyId: new Types.ObjectId(dto.propertyId),
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

    await this.auditService.log(landlordId, 'TENANT_ONBOARDED', 'Tenant', tenant._id.toString(), {}, {
      tenantEmail: dto.email, propertyId: dto.propertyId,
    });

    // Sync room occupancy counters now that a new tenant is placed in the room
    if (dto.roomId) await this.roomsService.syncRoomOccupancy(dto.roomId);

    return { message: 'Tenant added successfully', data: { tenant, tenantUser: { id: tenantUser._id, email: tenantUser.email } } };
  }

  async findAll(landlordId: string, query: any) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: any = { isDeleted: false };
    if (query.role !== 'SUPER_ADMIN') {
      filter.landlordId = new Types.ObjectId(landlordId);
    }
    if (query.status) filter.status = query.status;
    if (query.propertyId) filter.propertyId = new Types.ObjectId(query.propertyId);

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

  async findOne(id: string, landlordId: string, role?: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Tenant not found');
    const oid = new Types.ObjectId(id);

    // 1. Try finding by Tenant _id
    let tenant = await this.tenantModel
      .findOne({ _id: oid, isDeleted: false })
      .populate('userId', 'firstName lastName email phone profile status isEmailVerified isPhoneVerified')
      .populate('propertyId', 'name address type paymentMethods')
      .populate('roomId', 'roomNumber type monthlyRent')
      .populate('bedId', 'bedNumber')
      .populate('landlordId', 'firstName lastName email phone');

    // 2. If not found by _id, try finding by userId (e.g. from users list)
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
    return { data: tenant };
  }

  async getStayHistory(id: string, landlordId: string, role?: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Tenant record not found');
    const oid = new Types.ObjectId(id);

    // Resolve userId
    let userId = oid;
    const tenantRec = await this.tenantModel.findById(oid);
    if (tenantRec) {
      userId = tenantRec.userId;
    }

    const filter: any = { userId, isDeleted: false };
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

  async update(id: string, landlordId: string, dto: any) {
    const tenant = await this.tenantModel.findOne({ _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId) });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.tenantModel.updateOne({ _id: tenant._id }, { $set: dto });
    await this.auditService.log(landlordId, 'TENANT_UPDATED', 'Tenant', id, {}, dto);
    return { message: 'Tenant updated' };
  }

  async vacate(id: string, landlordId: string, vacatingDate: string) {
    const tenant = await this.tenantModel.findOne({ _id: new Types.ObjectId(id), landlordId: new Types.ObjectId(landlordId) });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.tenantModel.updateOne({ _id: tenant._id }, {
      status: 'VACATED', vacatingDate: new Date(vacatingDate),
    });
    await this.auditService.log(landlordId, 'TENANT_VACATED', 'Tenant', id, { status: 'ACTIVE' }, { status: 'VACATED', vacatingDate });

    // Sync room occupancy after tenant is vacated
    if (tenant.roomId) await this.roomsService.syncRoomOccupancy(tenant.roomId);

    return { message: 'Tenant marked as vacated' };
  }

  async getPaymentHistory(tenantId: string, landlordId: string) {
    const tenant = await this.tenantModel.findOne({ _id: new Types.ObjectId(tenantId), landlordId: new Types.ObjectId(landlordId) });
    if (!tenant) throw new NotFoundException('Tenant not found');
    // Payment history is fetched by PaymentsService filtered by tenantId
    return { data: { tenantId, message: 'Use /payments?tenantId= for payment history' } };
  }
}
