import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RentalApplication, RentalApplicationSchema } from './schemas/application.schema';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Room, RoomSchema } from '../rooms/rooms.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { RoomAvailabilityEvent, RoomAvailabilityEventSchema } from '../rooms/schemas/room-availability-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentalApplication.name, schema: RentalApplicationSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Room.name, schema: RoomSchema },
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: RoomAvailabilityEvent.name, schema: RoomAvailabilityEventSchema },
    ]),
    NotificationsModule,
    AuditModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
