import {
  Module, Injectable, Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { MongooseModule, InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Model, Connection } from 'mongoose';
import {
  IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max, IsInt, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoomAvailabilityEvent, RoomAvailabilityEventSchema } from './schemas/room-availability-event.schema';
import { SubscriptionsService } from '../users/subscriptions.service';
import { UsersModule } from '../users/users.module';
import { forwardRef } from '@nestjs/common';

// ─── Schema ──────────────────────────────────────────────────────────────────

export const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'DORM', 'DORMITORY', 'PRIVATE', 'STUDIO'] as const;
export const ROOM_STATUSES = [
  'AVAILABLE',
  'OCCUPIED',
  'PARTIALLY_OCCUPIED',
  'FULLY_OCCUPIED',
  'NOTICE_PERIOD',
  'MAINTENANCE',
  'UNAVAILABLE',
  'RESERVED',
] as const;

@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true }) propertyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Organization' }) organizationId: Types.ObjectId;
  @Prop({ required: true }) roomNumber: string;
  @Prop({ type: String, enum: ROOM_TYPES, default: 'SINGLE' }) type: string;
  @Prop({ default: 1 }) capacity: number;
  @Prop({ default: 0 }) occupiedCount: number;
  @Prop({ default: 0 }) monthlyRent: number;
  @Prop({ default: 0 }) rentPerBed: number;
  @Prop({ default: 0 }) deposit: number;
  @Prop({ type: Number, default: 0 }) floor: number;
  @Prop({ default: '' }) description: string;
  @Prop({ type: String, enum: ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'], default: 'SEMI_FURNISHED' }) furnishing: string;
  @Prop({ type: String, enum: ROOM_STATUSES, default: 'AVAILABLE', index: true }) status: string;
  @Prop({ type: [String], default: [] }) amenities: string[];
  @Prop({ type: [String], default: [] }) images: string[];

  // Future availability for NOTICE_PERIOD or general scheduling
  @Prop({ type: Date }) availableFrom?: Date;

  // Notice Period tracking
  @Prop({
    type: {
      submittedAt: Date,
      moveOutDate: Date,
      actualMoveOutDate: Date,
      reason: String,
      recordedBy: { type: Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
    },
    default: null,
  })
  noticeDetails?: {
    submittedAt?: Date;
    moveOutDate?: Date;
    actualMoveOutDate?: Date;
    reason?: string;
    recordedBy?: Types.ObjectId;
    status?: string;
  } | null;

  // Maintenance tracking
  @Prop({
    type: {
      reason: String,
      description: String,
      startDate: Date,
      expectedEndDate: Date,
      actualEndDate: Date,
      notes: String,
    },
    default: null,
  })
  maintenanceDetails?: {
    reason?: string;
    description?: string;
    startDate?: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    notes?: string;
  } | null;

  @Prop({ default: false }) isDeleted: boolean;
}
export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ propertyId: 1, status: 1 });
RoomSchema.index({ propertyId: 1, floor: 1 });

// Minimal Property model reference for counters & ownership
@Schema({ collection: 'properties' })
class PropertyRef {
  @Prop() totalRooms: number;
  @Prop() totalBeds: number;
  @Prop({ type: Types.ObjectId }) landlordId: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) organizationId: Types.ObjectId;
  @Prop() name: string;
}
const PropertyRefSchema = SchemaFactory.createForClass(PropertyRef);

// Minimal Tenant reference for occupancy counting
@Schema({ collection: 'tenants' })
class TenantRef {
  @Prop({ type: Types.ObjectId, ref: 'User' }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) roomId: Types.ObjectId;
  @Prop() status: string;
  @Prop() joiningDate: Date;
  @Prop() vacatingDate?: Date;
  @Prop({ default: false }) isDeleted: boolean;
}
const TenantRefSchema = SchemaFactory.createForClass(TenantRef);

// ─── DTOs ────────────────────────────────────────────────────────────────────

export class CreateRoomDto {
  @IsString() propertyId: string;
  @IsString() roomNumber: string;
  @IsOptional() @IsEnum(ROOM_TYPES) type?: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) @Type(() => Number) capacity?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) rentPerBed?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) monthlyRent?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) deposit?: number;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) floor?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() furnishing?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @IsOptional() @IsInt() @Min(1) @Max(200) @Type(() => Number) count?: number;
}

export class UpdateRoomDto {
  @IsOptional() @IsString() roomNumber?: string;
  @IsOptional() @IsEnum(ROOM_TYPES) type?: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) @Type(() => Number) capacity?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) rentPerBed?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) monthlyRent?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) deposit?: number;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) floor?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() furnishing?: string;
  @IsOptional() @IsEnum(ROOM_STATUSES) status?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
}

export class StartMaintenanceDto {
  @IsString() reason: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() expectedEndDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class EndMaintenanceDto {
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(['AVAILABLE', 'UNAVAILABLE']) nextStatus?: string;
}

export class RecordNoticeDto {
  @IsDateString() moveOutDate: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}

export class SetAvailabilityDto {
  @IsEnum(ROOM_STATUSES) status: string;
  @IsOptional() @IsDateString() availableFrom?: string;
  @IsOptional() @IsString() notes?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room & Document>,
    @InjectModel(PropertyRef.name) private propertyModel: Model<PropertyRef & Document>,
    @InjectModel(TenantRef.name) private tenantRefModel: Model<TenantRef & Document>,
    @InjectModel(RoomAvailabilityEvent.name) private eventModel: Model<RoomAvailabilityEvent & Document>,
    @InjectConnection() private connection: Connection,
    private subscriptionsService: SubscriptionsService,
  ) { }

  private async assertPropertyOwnership(propertyId: string, userId: string, role: string, requiredPermission?: string) {
    if (!propertyId || !Types.ObjectId.isValid(propertyId))
      throw new BadRequestException('Valid propertyId is required');
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (role === 'SUPER_ADMIN') return property;
    if (role === 'LANDLORD') {
      if (property.landlordId?.toString() !== userId) {
        throw new ForbiddenException('This property does not belong to you');
      }
      return property;
    }
    if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.connection.model('PropertyManagerAssignment');
      const assignment = await assignmentModel.findOne({
        userId: new Types.ObjectId(userId),
        propertyId: property._id,
        status: 'ACTIVE',
        isDeleted: false,
      });
      if (!assignment) {
        throw new ForbiddenException('You are not assigned as a Property Manager for this property');
      }
      if (requiredPermission && (assignment as any).permissions && !(assignment as any).permissions[requiredPermission]) {
        throw new ForbiddenException(`You do not have permission (${requiredPermission}) on this property`);
      }
      return property;
    }
    throw new ForbiddenException('Access denied');
  }

  async findByProperty(propertyId: string, userId: string, role: string) {
    await this.assertPropertyOwnership(propertyId, userId, role);
    const rooms = await this.roomModel
      .find({ propertyId: new Types.ObjectId(propertyId), isDeleted: false })
      .sort({ floor: 1, roomNumber: 1 });

    // Populate active tenant names if room is occupied or in notice period
    const roomIds = rooms.map(r => r._id);
    const activeTenants = await this.tenantRefModel
      .find({ roomId: { $in: roomIds }, status: { $in: ['ACTIVE', 'NOTICE_PERIOD'] }, isDeleted: false })
      .populate('userId', 'firstName lastName email phone')
      .lean();

    const tenantMap = new Map<string, any[]>();
    for (const t of activeTenants) {
      const key = t.roomId?.toString();
      if (key) {
        if (!tenantMap.has(key)) tenantMap.set(key, []);
        tenantMap.get(key)!.push(t);
      }
    }

    return rooms.map(r => {
      const doc = r.toObject();
      const tenants = tenantMap.get(r._id.toString()) || [];
      return {
        ...doc,
        currentTenants: tenants.map(t => ({
          tenantId: t._id,
          name: t.userId ? `${(t.userId as any).firstName} ${(t.userId as any).lastName || ''}`.trim() : 'Active Tenant',
          email: (t.userId as any)?.email,
          phone: (t.userId as any)?.phone,
          status: t.status,
          joiningDate: t.joiningDate,
          vacatingDate: t.vacatingDate,
        })),
      };
    });
  }

  async create(landlordId: string, role: string, dto: CreateRoomDto) {
    if (role !== 'SUPER_ADMIN') {
      const canAdd = await this.subscriptionsService.canAddUnits(landlordId, 1);
      if (!canAdd.allowed) {
        throw new ForbiddenException(canAdd.upgradeMessage);
      }
    }

    const session = await this.connection.startSession();
    try {
      let room!: Room & Document;
      await session.withTransaction(async () => {
        const property = await this.assertPropertyOwnership(dto.propertyId, landlordId, role);
        [room] = await this.roomModel.create([{
          propertyId: property._id,
          organizationId: property.organizationId ?? new Types.ObjectId(landlordId),
          roomNumber: dto.roomNumber,
          type: dto.type ?? 'SINGLE',
          capacity: dto.capacity ?? 1,
          rentPerBed: dto.rentPerBed ?? 0,
          monthlyRent: dto.monthlyRent ?? 0,
          deposit: dto.deposit ?? 0,
          floor: dto.floor ?? 0,
          description: dto.description ?? '',
          furnishing: dto.furnishing ?? 'SEMI_FURNISHED',
          amenities: Array.isArray(dto.amenities) ? dto.amenities : [],
          images: Array.isArray(dto.images) ? dto.images : [],
          status: 'AVAILABLE',
        }], { session });

        await this.eventModel.create([{
          roomId: room._id,
          propertyId: property._id,
          landlordId: property.landlordId,
          eventType: 'STATUS_CHANGE',
          fromStatus: 'NONE',
          toStatus: 'AVAILABLE',
          reason: 'Room created',
          actorId: new Types.ObjectId(landlordId),
          actorRole: role,
        }], { session });

        await this.syncPropertyCounters(property._id.toString(), session);
      });
      return room;
    } finally {
      await session.endSession();
    }
  }

  async createBulk(landlordId: string, role: string, dto: CreateRoomDto) {
    const count = Math.min(Math.max(Number(dto.count) || 1, 1), 200);
    const type: string = (dto.type ?? 'SINGLE').toUpperCase();

    if (role !== 'SUPER_ADMIN') {
      const canAdd = await this.subscriptionsService.canAddUnits(landlordId, count);
      if (!canAdd.allowed) {
        throw new ForbiddenException(canAdd.upgradeMessage);
      }
    }

    const session = await this.connection.startSession();
    try {
      let rooms: Array<Room & Document> = [];
      await session.withTransaction(async () => {
        const property = await this.assertPropertyOwnership(dto.propertyId, landlordId, role);
        const docs = Array.from({ length: count }, (_, i) => ({
          propertyId: property._id,
          organizationId: property.organizationId ?? new Types.ObjectId(landlordId),
          roomNumber: `${type}-${String(i + 1).padStart(2, '0')}`,
          type: dto.type ?? 'SINGLE',
          capacity: dto.capacity ?? 1,
          rentPerBed: dto.rentPerBed ?? 0,
          monthlyRent: dto.monthlyRent ?? 0,
          deposit: dto.deposit ?? 0,
          floor: dto.floor ?? 0,
          description: dto.description ?? '',
          furnishing: dto.furnishing ?? 'SEMI_FURNISHED',
          status: 'AVAILABLE',
        }));
        rooms = await this.roomModel.create(docs, { session }) as Array<Room & Document>;

        const eventDocs = rooms.map(r => ({
          roomId: r._id,
          propertyId: property._id,
          landlordId: property.landlordId,
          eventType: 'STATUS_CHANGE',
          fromStatus: 'NONE',
          toStatus: 'AVAILABLE',
          reason: 'Bulk room creation',
          actorId: new Types.ObjectId(landlordId),
          actorRole: role,
        }));
        await this.eventModel.create(eventDocs, { session });

        await this.syncPropertyCounters(property._id.toString(), session);
      });
      return rooms;
    } finally {
      await session.endSession();
    }
  }

  async update(id: string, userId: string, role: string, dto: UpdateRoomDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(id);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    const allowed: Partial<UpdateRoomDto> = {};
    for (const key of ['roomNumber', 'type', 'capacity', 'rentPerBed', 'monthlyRent', 'deposit', 'floor', 'description', 'furnishing', 'status', 'amenities', 'images'] as const) {
      if ((dto as any)[key] !== undefined) (allowed as any)[key] = (dto as any)[key];
    }
    const updated = await this.roomModel.findByIdAndUpdate(id, allowed, { new: true });
    if (updated) {
      await this.syncPropertyCounters(updated.propertyId.toString());
    }
    return updated;
  }

  async softDelete(id: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(id);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    await this.roomModel.findByIdAndUpdate(id, { isDeleted: true });
    await this.syncPropertyCounters(room.propertyId.toString());
  }

  /**
   * ── Availability Management Methods ──────────────────────────────────────
   */

  async startMaintenance(roomId: string, userId: string, role: string, dto: StartMaintenanceDto) {
    if (!Types.ObjectId.isValid(roomId)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(roomId);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    const property = await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    const fromStatus = room.status;
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const expectedEndDate = dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined;

    const maintenanceDetails = {
      reason: dto.reason,
      description: dto.description || '',
      startDate,
      expectedEndDate,
      notes: dto.notes || '',
    };

    const updated = await this.roomModel.findByIdAndUpdate(
      roomId,
      {
        $set: {
          status: 'MAINTENANCE',
          maintenanceDetails,
          availableFrom: expectedEndDate,
        },
      },
      { new: true },
    );

    await this.eventModel.create({
      roomId: room._id,
      propertyId: property._id,
      landlordId: property.landlordId,
      eventType: 'MAINTENANCE_START',
      fromStatus,
      toStatus: 'MAINTENANCE',
      reason: dto.reason,
      notes: dto.notes,
      startDate,
      expectedEndDate,
      actorId: new Types.ObjectId(userId),
      actorRole: role,
    });

    return updated;
  }

  async endMaintenance(roomId: string, userId: string, role: string, dto?: EndMaintenanceDto) {
    if (!Types.ObjectId.isValid(roomId)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(roomId);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    const property = await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    const fromStatus = room.status;
    const nextStatus = dto?.nextStatus || 'AVAILABLE';

    const updated = await this.roomModel.findByIdAndUpdate(
      roomId,
      {
        $set: {
          status: nextStatus,
          availableFrom: nextStatus === 'AVAILABLE' ? new Date() : undefined,
          'maintenanceDetails.actualEndDate': new Date(),
        },
      },
      { new: true },
    );

    await this.eventModel.create({
      roomId: room._id,
      propertyId: property._id,
      landlordId: property.landlordId,
      eventType: 'MAINTENANCE_END',
      fromStatus,
      toStatus: nextStatus,
      notes: dto?.notes || 'Maintenance completed',
      actualEndDate: new Date(),
      actorId: new Types.ObjectId(userId),
      actorRole: role,
    });

    return updated;
  }

  async recordNotice(roomId: string, userId: string, role: string, dto: RecordNoticeDto) {
    if (!Types.ObjectId.isValid(roomId)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(roomId);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    const property = await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    const fromStatus = room.status;
    const moveOutDate = new Date(dto.moveOutDate);
    const nextDay = new Date(moveOutDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const noticeDetails = {
      submittedAt: new Date(),
      moveOutDate,
      reason: dto.reason || 'Notice period submitted',
      recordedBy: new Types.ObjectId(userId),
      status: 'CONFIRMED',
    };

    const updated = await this.roomModel.findByIdAndUpdate(
      roomId,
      {
        $set: {
          status: 'NOTICE_PERIOD',
          noticeDetails,
          availableFrom: nextDay, // Publicly bookable from the day after move out
        },
      },
      { new: true },
    );

    await this.eventModel.create({
      roomId: room._id,
      propertyId: property._id,
      landlordId: property.landlordId,
      eventType: 'NOTICE_RECORDED',
      fromStatus,
      toStatus: 'NOTICE_PERIOD',
      reason: dto.reason,
      notes: dto.notes,
      expectedEndDate: moveOutDate,
      actorId: new Types.ObjectId(userId),
      actorRole: role,
    });

    return updated;
  }

  async cancelNotice(roomId: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(roomId)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(roomId);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    const property = await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    const fromStatus = room.status;

    const updated = await this.roomModel.findByIdAndUpdate(
      roomId,
      {
        $set: {
          status: 'OCCUPIED',
          noticeDetails: null,
          availableFrom: undefined,
        },
      },
      { new: true },
    );

    await this.eventModel.create({
      roomId: room._id,
      propertyId: property._id,
      landlordId: property.landlordId,
      eventType: 'NOTICE_CANCELLED',
      fromStatus,
      toStatus: 'OCCUPIED',
      reason: 'Notice period cancelled',
      actorId: new Types.ObjectId(userId),
      actorRole: role,
    });

    return updated;
  }

  async setAvailability(roomId: string, userId: string, role: string, dto: SetAvailabilityDto) {
    if (!Types.ObjectId.isValid(roomId)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(roomId);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    const property = await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    const fromStatus = room.status;
    const availableFrom = dto.availableFrom ? new Date(dto.availableFrom) : (dto.status === 'AVAILABLE' ? new Date() : undefined);

    const updated = await this.roomModel.findByIdAndUpdate(
      roomId,
      {
        $set: {
          status: dto.status,
          availableFrom,
        },
      },
      { new: true },
    );

    await this.eventModel.create({
      roomId: room._id,
      propertyId: property._id,
      landlordId: property.landlordId,
      eventType: 'STATUS_CHANGE',
      fromStatus,
      toStatus: dto.status,
      notes: dto.notes,
      startDate: availableFrom,
      actorId: new Types.ObjectId(userId),
      actorRole: role,
    });

    return updated;
  }

  async getRoomEvents(roomId: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(roomId)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(roomId);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    return this.eventModel
      .find({ roomId: new Types.ObjectId(roomId) })
      .populate('actorId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getPropertyTimeline(propertyId: string, userId: string, role: string) {
    await this.assertPropertyOwnership(propertyId, userId, role);
    const rooms = await this.roomModel
      .find({ propertyId: new Types.ObjectId(propertyId), isDeleted: false })
      .sort({ floor: 1, roomNumber: 1 });

    const roomIds = rooms.map(r => r._id);
    const recentEvents = await this.eventModel
      .find({ propertyId: new Types.ObjectId(propertyId) })
      .sort({ createdAt: -1 })
      .limit(100);

    return {
      rooms,
      recentEvents,
    };
  }

  /** Recalculate and sync property-level room/bed counters from actual documents. */
  async syncPropertyCounters(propertyId: string, session?: any) {
    const rooms = await this.roomModel.find(
      { propertyId: new Types.ObjectId(propertyId), isDeleted: false },
      null,
      session ? { session } : {},
    );
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((s, r) => s + (r.capacity ?? 0), 0);
    await this.propertyModel.findByIdAndUpdate(
      propertyId,
      { $set: { totalRooms, totalBeds } },
      session ? { session } : {},
    );
    return { totalRooms, totalBeds };
  }

  /** Recalculate room occupancy from tenant records */
  async syncRoomOccupancy(roomId: string | Types.ObjectId) {
    if (!roomId || !Types.ObjectId.isValid(roomId.toString())) return;
    const room = await this.roomModel.findById(roomId);
    if (!room) return;

    const occupiedCount = await this.tenantRefModel.countDocuments({
      roomId: new Types.ObjectId(roomId.toString()),
      status: { $in: ['ACTIVE', 'NOTICE_PERIOD'] },
      isDeleted: false,
    });

    let status = room.status;
    if (status !== 'MAINTENANCE' && status !== 'UNAVAILABLE') {
      if (occupiedCount === 0) status = 'AVAILABLE';
      else if (occupiedCount >= (room.capacity ?? 1)) status = 'FULLY_OCCUPIED';
      else status = 'PARTIALLY_OCCUPIED';
    }

    await this.roomModel.findByIdAndUpdate(roomId, { $set: { occupiedCount, status } });
  }

  async repairCounters(propertyId: string, userId: string, role: string) {
    await this.assertPropertyOwnership(propertyId, userId, role);
    return this.syncPropertyCounters(propertyId);
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'rooms', version: '1' })
export class RoomsController {
  constructor(private svc: RoomsService) { }

  @Get()
  findByQuery(@Query('propertyId') propertyId: string, @CurrentUser() user: any) {
    if (!propertyId) return { data: [] };
    return this.svc.findByProperty(propertyId, user.id, user.role).then(d => ({ data: d }));
  }

  @Get('sync/:propertyId')
  sync(@Param('propertyId') propertyId: string, @CurrentUser() user: any) {
    return this.svc.repairCounters(propertyId, user.id, user.role);
  }

  @Get('timeline/:propertyId')
  getTimeline(@Param('propertyId') pid: string, @CurrentUser() user: any) {
    return this.svc.getPropertyTimeline(pid, user.id, user.role).then(d => ({ data: d }));
  }

  @Get(':id/events')
  getRoomEvents(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.getRoomEvents(id, user.id, user.role).then(d => ({ data: d }));
  }

  @Get('by-property/:propertyId')
  findByProperty(@Param('propertyId') pid: string, @CurrentUser() user: any) {
    return this.svc.findByProperty(pid, user.id, user.role).then(d => ({ data: d }));
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateRoomDto) {
    const count = Number(dto.count);
    if (count > 1) {
      const rooms = await this.svc.createBulk(user.id, user.role, dto);
      return { data: rooms, count: rooms.length };
    }
    const room = await this.svc.create(user.id, user.role, dto);
    return { data: [room], count: 1 };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateRoomDto) {
    const updated = await this.svc.update(id, user.id, user.role, dto);
    return { data: updated };
  }

  @Post(':id/maintenance/start')
  async startMaintenance(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: StartMaintenanceDto) {
    const updated = await this.svc.startMaintenance(id, user.id, user.role, dto);
    return { message: 'Room maintenance started', data: updated };
  }

  @Post(':id/maintenance/end')
  async endMaintenance(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: EndMaintenanceDto) {
    const updated = await this.svc.endMaintenance(id, user.id, user.role, dto);
    return { message: 'Room maintenance completed', data: updated };
  }

  @Post(':id/notice')
  async recordNotice(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: RecordNoticeDto) {
    const updated = await this.svc.recordNotice(id, user.id, user.role, dto);
    return { message: 'Notice period recorded', data: updated };
  }

  @Delete(':id/notice')
  async cancelNotice(@Param('id') id: string, @CurrentUser() user: any) {
    const updated = await this.svc.cancelNotice(id, user.id, user.role);
    return { message: 'Notice period cancelled', data: updated };
  }

  @Patch(':id/availability')
  async setAvailability(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: SetAvailabilityDto) {
    const updated = await this.svc.setAvailability(id, user.id, user.role, dto);
    return { message: 'Room availability updated', data: updated };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.svc.softDelete(id, user.id, user.role);
    return { message: 'Room deleted' };
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: PropertyRef.name, schema: PropertyRefSchema },
      { name: TenantRef.name, schema: TenantRefSchema },
      { name: RoomAvailabilityEvent.name, schema: RoomAvailabilityEventSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService, MongooseModule],
})
export class RoomsModule { }
