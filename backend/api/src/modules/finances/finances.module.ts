import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertyExpense, PropertyExpenseSchema } from './schemas/expense.schema';
import { FinancesService } from './finances.service';
import { FinancesController } from './finances.controller';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PropertyExpense.name, schema: PropertyExpenseSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [FinancesController],
  providers: [FinancesService],
  exports: [FinancesService],
})
export class FinancesModule {}
