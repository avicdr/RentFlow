import {
  Module, Injectable, Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { MongooseModule, InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Model, Connection } from 'mongoose';
import {
  IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// ─── Schema ──────────────────────────────────────────────────────────────────

@Schema({ timestamps: true, collection: 'rooms' })
class Room {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true }) propertyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Organization' }) organizationId: Types.ObjectId;
  @Prop({ required: true }) roomNumber: string;
  @Prop({ type: String, enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'DORM', 'DORMITORY', 'PRIVATE', 'STUDIO'], default: 'SINGLE' }) type: string;
  @Prop({ default: 1 }) capacity: number;
  @Prop({ default: 0 }) occupiedCount: number;
  @Prop({ default: 0 }) monthlyRent: number;
  @Prop({ default: 0 }) rentPerBed: number;
  @Prop({ type: Number, default: 0 }) floor: number;
  @Prop() description: string;
  @Prop({ type: String, enum: ['AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' }) status: string;
  @Prop({ type: [String], default: [] }) amenities: string[];
  @Prop({ default: false }) isDeleted: boolean;
}
const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ propertyId: 1, status: 1 });

// Minimal Property model reference so we can update counters and verify ownership
@Schema({ collection: 'properties' })
class PropertyRef {
  @Prop() totalRooms: number;
  @Prop() totalBeds: number;
  @Prop({ type: Types.ObjectId }) landlordId: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) organizationId: Types.ObjectId;
}
const PropertyRefSchema = SchemaFactory.createForClass(PropertyRef);

// Minimal Tenant reference for occupancy counting
@Schema({ collection: 'tenants' })
class TenantRef {
  @Prop({ type: Types.ObjectId }) roomId: Types.ObjectId;
  @Prop() status: string;
  @Prop({ default: false }) isDeleted: boolean;
}
const TenantRefSchema = SchemaFactory.createForClass(TenantRef);

// ─── DTO ─────────────────────────────────────────────────────────────────────

const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD', 'DORM', 'DORMITORY', 'PRIVATE', 'STUDIO'] as const;
const ROOM_STATUSES = ['AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED', 'MAINTENANCE'] as const;

export class CreateRoomDto {
  @IsString() propertyId: string;
  @IsString() roomNumber: string;
  @IsOptional() @IsEnum(ROOM_TYPES) type?: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) @Type(() => Number) capacity?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) rentPerBed?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) monthlyRent?: number;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) floor?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  // count is a bulk-create convenience field — not a room property
  @IsOptional() @IsInt() @Min(1) @Max(200) @Type(() => Number) count?: number;
}

export class UpdateRoomDto {
  @IsOptional() @IsString() roomNumber?: string;
  @IsOptional() @IsEnum(ROOM_TYPES) type?: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) @Type(() => Number) capacity?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) rentPerBed?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) monthlyRent?: number;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) floor?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(ROOM_STATUSES) status?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room & Document>,
    @InjectModel(PropertyRef.name) private propertyModel: Model<PropertyRef & Document>,
    @InjectModel(TenantRef.name) private tenantRefModel: Model<TenantRef & Document>,
    @InjectConnection() private connection: Connection,
  ) {}

  // Verify the property belongs to this landlord (admins bypass). Returns the property, and
  // its organizationId so rooms inherit the correct org instead of trusting client input.
  private async assertPropertyOwnership(propertyId: string, userId: string, role: string) {
    if (!propertyId || !Types.ObjectId.isValid(propertyId))
      throw new BadRequestException('Valid propertyId is required');
    const property = await this.propertyModel.findById(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    if (role !== 'SUPER_ADMIN' && property.landlordId?.toString() !== userId)
      throw new ForbiddenException('This property does not belong to you');
    return property;
  }

  async findByProperty(propertyId: string, userId: string, role: string) {
    await this.assertPropertyOwnership(propertyId, userId, role);
    return this.roomModel
      .find({ propertyId: new Types.ObjectId(propertyId), isDeleted: false })
      .sort({ roomNumber: 1 });
  }

  async create(landlordId: string, role: string, dto: CreateRoomDto) {
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
          floor: dto.floor ?? 0,
          description: dto.description ?? '',
          amenities: Array.isArray(dto.amenities) ? dto.amenities : [],
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
          floor: dto.floor ?? 0,
          description: dto.description ?? '',
        }));
        rooms = await this.roomModel.create(docs, { session }) as Array<Room & Document>;
        await this.syncPropertyCounters(property._id.toString(), session);
      });
      return rooms;
    } finally {
      await session.endSession();
    }
  }

  async softDelete(id: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(id);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    // Verify the room's property belongs to the caller before deleting.
    await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    await this.roomModel.findByIdAndUpdate(id, { isDeleted: true });
    await this.syncPropertyCounters(room.propertyId.toString());
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

  /**
   * Recalculate `occupiedCount` and `status` for a single room based on
   * active tenant records. Call this after any tenant create/vacate.
   */
  async syncRoomOccupancy(roomId: string | Types.ObjectId) {
    if (!roomId || !Types.ObjectId.isValid(roomId.toString())) return;
    const room = await this.roomModel.findById(roomId);
    if (!room) return;

    const occupiedCount = await this.tenantRefModel.countDocuments({
      roomId: new Types.ObjectId(roomId.toString()),
      status: { $in: ['ACTIVE', 'NOTICE_PERIOD'] },
      isDeleted: false,
    });

    let status: string;
    if (occupiedCount === 0) status = 'AVAILABLE';
    else if (occupiedCount >= (room.capacity ?? 1)) status = 'FULLY_OCCUPIED';
    else status = 'PARTIALLY_OCCUPIED';

    await this.roomModel.findByIdAndUpdate(roomId, { $set: { occupiedCount, status } });
  }

  async update(id: string, userId: string, role: string, dto: UpdateRoomDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Room not found');
    const room = await this.roomModel.findById(id);
    if (!room || room.isDeleted) throw new NotFoundException('Room not found');
    await this.assertPropertyOwnership(room.propertyId.toString(), userId, role);

    // Whitelist mutable fields — clients can't move a room to another property or edit occupancy directly.
    const allowed: Partial<UpdateRoomDto> = {};
    for (const key of ['roomNumber', 'type', 'capacity', 'rentPerBed', 'monthlyRent', 'floor', 'description', 'status', 'amenities'] as const) {
      if ((dto as any)[key] !== undefined) (allowed as any)[key] = (dto as any)[key];
    }
    const updated = await this.roomModel.findByIdAndUpdate(id, allowed, { new: true });
    if (updated) {
      await this.syncPropertyCounters(updated.propertyId.toString());
    }
    return updated;
  }

  // Ownership-checked wrapper for the exposed counter-repair endpoint.
  async repairCounters(propertyId: string, userId: string, role: string) {
    await this.assertPropertyOwnership(propertyId, userId, role);
    return this.syncPropertyCounters(propertyId);
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'rooms', version: '1' })
class RoomsController {
  constructor(private svc: RoomsService) {}

  @Get()
  findByQuery(@Query('propertyId') propertyId: string, @CurrentUser() user: any) {
    if (!propertyId) return { data: [] };
    return this.svc.findByProperty(propertyId, user.id, user.role).then(d => ({ data: d }));
  }

  @Get('sync/:propertyId')
  sync(@Param('propertyId') propertyId: string, @CurrentUser() user: any) {
    return this.svc.repairCounters(propertyId, user.id, user.role);
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
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
