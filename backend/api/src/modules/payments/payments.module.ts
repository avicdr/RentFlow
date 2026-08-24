import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ReceiptService } from './receipt.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: 'Tenant', schema: require('../tenants/schemas/tenant.schema').TenantSchema },
      { name: 'User', schema: require('../users/schemas/user.schema').UserSchema },
      { name: 'Property', schema: require('../properties/schemas/property.schema').PropertySchema },
    ]),
    NotificationsModule,
    AuditModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, ReceiptService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
