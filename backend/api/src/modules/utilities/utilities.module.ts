import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilityBill, UtilityBillSchema } from './schemas/utility-bill.schema';
import { UtilitiesService } from './utilities.service';
import { UtilitiesController } from './utilities.controller';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UtilityBill.name, schema: UtilityBillSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [UtilitiesController],
  providers: [UtilitiesService],
  exports: [UtilitiesService],
})
export class UtilitiesModule {}
