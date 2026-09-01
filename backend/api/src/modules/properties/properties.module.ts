import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from './schemas/property.schema';
import {
  PropertyManagerAssignment,
  PropertyManagerAssignmentSchema,
} from './schemas/property-manager-assignment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyManagersService } from './property-managers.service';
import { PropertyManagersController } from './property-managers.controller';
import { AuditModule } from '../audit/audit.module';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: PropertyManagerAssignment.name, schema: PropertyManagerAssignmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuditModule,
    RoomsModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [PropertiesController, PropertyManagersController],
  providers: [PropertiesService, PropertyManagersService],
  exports: [PropertiesService, PropertyManagersService],
})
export class PropertiesModule {}

