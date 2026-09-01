import { Module, Injectable, Controller, Get, Query, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { MongooseModule, InjectModel } from '@nestjs/mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Model } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Schema({ collection: 'properties' })
class PropertyListingRef {
  @Prop() landlordId: Types.ObjectId;
  @Prop() name: string;
  @Prop() slug: string;
  @Prop() type: string;
  @Prop() status: string;
  @Prop() listingStatus: string;
  @Prop() isDeleted: boolean;
  @Prop({ type: Object }) address: any;
  @Prop({ type: Object }) amenities: any;
  @Prop({ type: Object }) listingDetails: any;
  @Prop({ type: [String] }) images: string[];
  @Prop() description: string;
  @Prop() totalBeds: number;
  @Prop() occupiedBeds: number;
  @Prop() isVerified: boolean;
  @Prop() publishedAt: Date;
}
const PropertyListingRefSchema = SchemaFactory.createForClass(PropertyListingRef);

@Schema({ collection: 'rooms' })
class RoomListingRef {
  @Prop() propertyId: Types.ObjectId;
  @Prop() roomNumber: string;
  @Prop() type: string;
  @Prop() monthlyRent: number;
  @Prop() rentPerBed: number;
  @Prop() deposit: number;
  @Prop() capacity: number;
  @Prop() occupiedCount: number;
  @Prop() floor: number;
  @Prop() description: string;
  @Prop() furnishing: string;
  @Prop() isDeleted: boolean;
  @Prop() status: string;
  @Prop({ type: [String] }) amenities: string[];
  @Prop({ type: [String] }) images: string[];
  @Prop() availableFrom: Date;
}
const RoomListingRefSchema = SchemaFactory.createForClass(RoomListingRef);

@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(PropertyListingRef.name) private propertyModel: Model<PropertyListingRef & Document>,
    @InjectModel(RoomListingRef.name) private roomModel: Model<RoomListingRef & Document>,
  ) {}

  private sanitizePublicRoom(r: any) {
    const capacity = r.capacity || 1;
    const occupied = r.occupiedCount || 0;
    const availableBeds = Math.max(0, capacity - occupied);

    return {
      _id: r._id,
      roomNumber: r.roomNumber,
      type: r.type || 'SINGLE',
      monthlyRent: r.monthlyRent || 0,
      rentPerBed: r.rentPerBed || 0,
      deposit: r.deposit || 0,
      capacity,
      occupiedCount: occupied,
      availableBeds,
      floor: r.floor || 0,
      description: r.description || '',
      furnishing: r.furnishing || 'SEMI_FURNISHED',
      status: r.status || 'AVAILABLE',
      amenities: r.amenities || [],
      images: r.images || [],
      availableFrom: r.availableFrom,
    };
  }

  async getPublishedListings(filter: any = {}, options: any = {}) {
    const matchFilter: any = {
      isDeleted: false,
      listingStatus: 'PUBLISHED',
      status: 'ACTIVE',
      ...filter,
    };

    const properties = await this.propertyModel.aggregate([
      { $match: matchFilter },
      { $lookup: { from: 'rooms', localField: '_id', foreignField: 'propertyId', as: 'rooms' } },
      { $sort: { publishedAt: -1, createdAt: -1 } },
    ]);

    const listings = properties.map(p => {
      const activeRooms = (p.rooms || []).filter((r: any) => !r.isDeleted);
      const publicRooms = activeRooms.map((r: any) => this.sanitizePublicRoom(r));

      const totalCapacity = publicRooms.reduce((sum, r) => sum + r.capacity, 0);
      const occupied = publicRooms.reduce((sum, r) => sum + r.occupiedCount, 0);
      const availableBeds = Math.max(0, totalCapacity - occupied);

      const availableRooms = publicRooms.filter(r => r.status === 'AVAILABLE' || r.status === 'PARTIALLY_OCCUPIED' || r.status === 'NOTICE_PERIOD');
      const minRent = publicRooms.length > 0
        ? Math.min(...publicRooms.map(r => r.rentPerBed || r.monthlyRent || 0).filter(Boolean))
        : 0;

      return {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        propertyType: p.type,
        address: p.address,
        amenities: p.amenities || {},
        listingDetails: p.listingDetails || {},
        images: p.images || [],
        description: p.description || '',
        isVerified: !!p.isVerified,
        totalRooms: publicRooms.length,
        totalBeds: totalCapacity,
        availableBeds,
        minRent: minRent === Infinity ? 0 : minRent,
        availableRoomsCount: availableRooms.length,
        rooms: publicRooms,
      };
    });

    return { data: listings, meta: { total: listings.length } };
  }

  async findBySlug(slug: string) {
    const property = await this.propertyModel.findOne({
      slug,
      isDeleted: false,
      listingStatus: 'PUBLISHED',
    }).lean();

    if (!property) {
      throw new NotFoundException('Property listing not found or is currently private');
    }

    const rooms = await this.roomModel
      .find({ propertyId: property._id, isDeleted: false })
      .sort({ floor: 1, roomNumber: 1 })
      .lean();

    const publicRooms = rooms.map(r => this.sanitizePublicRoom(r));
    const totalCapacity = publicRooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupied = publicRooms.reduce((sum, r) => sum + r.occupiedCount, 0);
    const availableBeds = Math.max(0, totalCapacity - occupied);

    const minRent = publicRooms.length > 0
      ? Math.min(...publicRooms.map(r => r.rentPerBed || r.monthlyRent || 0).filter(Boolean))
      : 0;

    return {
      data: {
        _id: property._id,
        name: property.name,
        slug: property.slug,
        propertyType: property.type,
        address: property.address,
        amenities: property.amenities || {},
        listingDetails: property.listingDetails || {},
        images: property.images || [],
        description: property.description || '',
        isVerified: !!property.isVerified,
        totalRooms: publicRooms.length,
        totalBeds: totalCapacity,
        availableBeds,
        minRent: minRent === Infinity ? 0 : minRent,
        rooms: publicRooms,
      },
    };
  }

  async findOnePublic(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid property ID');
    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(id),
      isDeleted: false,
      listingStatus: 'PUBLISHED',
    }).lean();

    if (!property) throw new NotFoundException('Property not found');
    return this.findBySlug(property.slug || property._id.toString());
  }

  async findAllForLandlord(landlordId: string) {
    return this.getPublishedListings({ landlordId: new Types.ObjectId(landlordId) });
  }

  async findAllPublic(query: any = {}) {
    const filter: any = {};
    if (query.city) filter['address.city'] = new RegExp(query.city, 'i');
    if (query.type) filter.type = query.type;
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { 'address.city': new RegExp(query.search, 'i') },
        { 'address.line1': new RegExp(query.search, 'i') },
      ];
    }
    return this.getPublishedListings(filter);
  }
}

@Controller({ path: 'listings', version: '1' })
export class ListingsController {
  constructor(private svc: ListingsService) {}

  // Public shareable endpoint: /api/v1/listings/slug/:slug
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  // Public discovery: /api/v1/listings/public
  @Get('public')
  findPublic(@Query('city') city?: string, @Query('type') type?: string, @Query('search') search?: string) {
    return this.svc.findAllPublic({ city, type, search });
  }

  // Public by ID: /api/v1/listings/public/:id
  @Get('public/:id')
  findOnePublic(@Param('id') id: string) {
    return this.svc.findOnePublic(id);
  }

  // Landlord/Super Admin overview of published listings
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  @Get()
  findAll(@CurrentUser() user: any) {
    if (user.role === 'SUPER_ADMIN') {
      return this.svc.findAllPublic({});
    }
    return this.svc.findAllForLandlord(user.id);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PropertyListingRef.name, schema: PropertyListingRefSchema },
      { name: RoomListingRef.name, schema: RoomListingRefSchema },
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
