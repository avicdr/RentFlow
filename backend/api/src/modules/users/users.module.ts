import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { RazorpayService } from './razorpay.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: 'Property', schema: new mongoose.Schema({}, { strict: false, collection: 'properties' }) },
    ]),
    AuditModule,
  ],
  controllers: [UsersController, SubscriptionsController],
  providers: [UsersService, SubscriptionsService, RazorpayService],
  exports: [UsersService, SubscriptionsService, RazorpayService],
})
export class UsersModule { }
