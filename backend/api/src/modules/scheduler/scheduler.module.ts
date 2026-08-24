import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulerService } from './scheduler.service';
import { TenantSchema } from '../tenants/schemas/tenant.schema';
import { PaymentSchema } from '../payments/schemas/payment.schema';
import { OtpSchema } from '../auth/schemas/otp.schema';
import { NotificationSchema } from '../notifications/schemas/notification.schema';
import { SessionSchema } from '../auth/schemas/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Tenant', schema: TenantSchema },
      { name: 'Payment', schema: PaymentSchema },
      { name: 'Otp', schema: OtpSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Session', schema: SessionSchema },
    ]),
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
