import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('id') userId: string) {
    return this.svc.getLandlordDashboard(userId).then(data => ({ data }));
  }

  @Get('complaints')
  getComplaintStats(@CurrentUser('id') userId: string) {
    return this.svc.getComplaintStats(userId).then(data => ({ data }));
  }

  @Get('payment-health')
  getPaymentHealth(@CurrentUser('id') userId: string) {
    return this.svc.getTenantPaymentHealth(userId).then(data => ({ data }));
  }
}
