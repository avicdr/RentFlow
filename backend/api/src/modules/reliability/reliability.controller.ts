import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReliabilityScoreService } from './reliability.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reliability Score')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'reliability', version: '1' })
export class ReliabilityController {
  constructor(private readonly svc: ReliabilityScoreService) {}

  @Get('me')
  @Roles('TENANT')
  getMyScore(@CurrentUser('id') userId: string) {
    return this.svc.getScoreByUser(userId).then(data => ({ data }));
  }

  @Get('tenant/:tenantId')
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  getTenantScore(@Param('tenantId') tenantId: string) {
    return this.svc.getScoreByTenant(tenantId).then(data => ({ data }));
  }

  @Post('recalculate/:tenantId')
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  recalculate(@Param('tenantId') tenantId: string) {
    return this.svc.calculateScore(tenantId, 'Manual recalculation requested').then(data => ({ data }));
  }
}
