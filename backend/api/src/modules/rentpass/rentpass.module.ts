import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RentPassShare, RentPassShareSchema } from './schemas/rentpass-share.schema';
import { RentPassService } from './rentpass.service';
import { RentPassController } from './rentpass.controller';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Lease, LeaseSchema } from '../leases/schemas/lease.schema';
import { ReliabilityModule } from '../reliability/reliability.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentPassShare.name, schema: RentPassShareSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Lease.name, schema: LeaseSchema },
    ]),
    ReliabilityModule,
  ],
  controllers: [RentPassController],
  providers: [RentPassService],
  exports: [RentPassService],
})
export class RentPassModule {}
