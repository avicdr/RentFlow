import { Module, Injectable, Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
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
  @Prop() type: string;
  @Prop() status: string;
  @Prop() isDeleted: boolean;
  @Prop({ type: Object }) address: any;
  @Prop() totalBeds: number;
  @Prop() occupiedBeds: number;
}
const PropertyListingRefSchema = SchemaFactory.createForClass(PropertyListingRef);

@Schema({ collection: 'rooms' })
class RoomListingRef {
  @Prop() propertyId: Types.ObjectId;
  @Prop() monthlyRent: number;
  @Prop() rentPerBed: number;
  @Prop() capacity: number;
  @Prop() occupiedCount: number;
  @Prop() isDeleted: boolean;
  @Prop() status: string;
}
const RoomListingRefSchema = SchemaFactory.createForClass(RoomListingRef);

@Injectable()
class ListingsService {
  constructor(
    @InjectModel(PropertyListingRef.name) private propertyModel: Model<PropertyListingRef & Document>,
    @InjectModel(RoomListingRef.name) private roomModel: Model<RoomListingRef & Document>,
  ) {}

  async getAutoListings(filter: any) {
    const properties = await this.propertyModel.aggregate([
      { $match: { ...filter, isDeleted: false, status: 'ACTIVE' } },
      { $lookup: { from: 'rooms', localField: '_id', foreignField: 'propertyId', as: 'rooms' } },
    ]);

    const listings = properties.map(p => {
      // Only consider rooms that aren't deleted
      const activeRooms = p.rooms.filter((r: any) => !r.isDeleted);
      
      // Calculate real available beds directly from rooms
      const totalCapacity = activeRooms.reduce((sum: number, r: any) => sum + (r.capacity || 0), 0);
      const occupied = activeRooms.reduce((sum: number, r: any) => sum + (r.occupiedCount || 0), 0);
      const availableBeds = totalCapacity - occupied;

      // Min rent among available rooms
      const availableRooms = activeRooms.filter((r: any) => (r.capacity || 0) > (r.occupiedCount || 0));
      const rentMin = availableRooms.length > 0
        ? Math.min(...availableRooms.map((r: any) => r.rentPerBed || r.monthlyRent || 0))
        : 0;

      return {
        _id: p._id,
        propertyId: p, // Acts as populated property
        name: p.name,
        propertyType: p.type,
        status: availableBeds > 0 ? 'ACTIVE' : 'INACTIVE',
        availableBeds,
        rentMin
      };
    }).filter(l => l.availableBeds > 0); // Auto-list only properties with available beds

    return { data: listings };
  }

  async findAll(landlordId: string) {
    return this.getAutoListings({ landlordId: new Types.ObjectId(landlordId) });
  }

  async findAllPublic(query: any = {}) {
    const filter: any = {};
    if (query.city) filter['address.city'] = new RegExp(query.city, 'i');
    return this.getAutoListings(filter);
  }

  async findOnePublic(id: string) {
    const res = await this.getAutoListings({ _id: new Types.ObjectId(id) });
    if (!res.data || res.data.length === 0) {
      // Need a standard 404 response or just return null and let controller handle
      return { data: null };
    }
    return { data: res.data[0] };
  }
}

@UseGuards(JwtAuthGuard)
@Controller({ path: 'listings', version: '1' })
class ListingsController {
  constructor(private svc: ListingsService) {}

  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  @Get()
  findAll(@CurrentUser() user: any) {
    if (user.role === 'SUPER_ADMIN') {
      return this.svc.findAllPublic({});
    }
    return this.svc.findAll(user.id);
  }

  @Get('public')
  findPublic(@Query('city') city?: string) {
    return this.svc.findAllPublic({ city });
  }

  @Get('public/:id')
  findOnePublic(@Param('id') id: string) {
    return this.svc.findOnePublic(id);
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
