import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReliabilityScore, ReliabilityScoreSchema } from './schemas/reliability-score.schema';
import { ReliabilityScoreService } from './reliability.service';
import { ReliabilityController } from './reliability.controller';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Lease, LeaseSchema } from '../leases/schemas/lease.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReliabilityScore.name, schema: ReliabilityScoreSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Lease.name, schema: LeaseSchema },
    ]),
  ],
  controllers: [ReliabilityController],
  providers: [ReliabilityScoreService],
  exports: [ReliabilityScoreService],
})
export class ReliabilityModule {}
