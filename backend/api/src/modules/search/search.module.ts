import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PropertySchema } from '../properties/schemas/property.schema';
import { UserSchema } from '../users/schemas/user.schema';
import { PaymentSchema } from '../payments/schemas/payment.schema';
import { TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Property', schema: PropertySchema },
      { name: 'User', schema: UserSchema },
      { name: 'Payment', schema: PaymentSchema },
      { name: 'Tenant', schema: TenantSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
