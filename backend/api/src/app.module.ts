import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { BedsModule } from './modules/beds/beds.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ListingsModule } from './modules/listings/listings.module';
import { VisitsModule } from './modules/visits/visits.module';
import { BrokersModule } from './modules/brokers/brokers.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { SearchModule } from './modules/search/search.module';
import { LeasesModule } from './modules/leases/leases.module';
import { ReliabilityModule } from './modules/reliability/reliability.module';
import { FinancesModule } from './modules/finances/finances.module';
import { RentPassModule } from './modules/rentpass/rentpass.module';
import { UtilitiesModule } from './modules/utilities/utilities.module';
import { MessagesModule } from './modules/messages/messages.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60000, limit: 60000 },
      { name: 'auth', ttl: 60000, limit: 10000 },
      { name: 'login', ttl: 900000, limit: 5000 }, // effectively bypassed for dev
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    RoomsModule,
    BedsModule,
    TenantsModule,
    PaymentsModule,
    ComplaintsModule,
    NotificationsModule,
    DocumentsModule,
    ListingsModule,
    VisitsModule,
    BrokersModule,
    AnalyticsModule,
    AuditModule,
    AdminModule,
    HealthModule,
    SchedulerModule,
    SearchModule,
    LeasesModule,
    ReliabilityModule,
    FinancesModule,
    RentPassModule,
    UtilitiesModule,
    MessagesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
