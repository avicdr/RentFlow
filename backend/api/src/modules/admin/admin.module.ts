import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Complaint, ComplaintSchema } from '../complaints/schemas/complaint.schema';
import { Organization, OrganizationSchema } from '../users/schemas/organization.schema';
import { DocModel, DocumentSchema } from '../documents/schemas/document.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Complaint.name, schema: ComplaintSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: DocModel.name, schema: DocumentSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    AuditModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
