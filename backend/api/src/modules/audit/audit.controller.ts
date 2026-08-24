import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
// Audit logs are platform-wide and unscoped (contain other users' actions + PII) — admins only.
@Roles('SUPER_ADMIN')
@Controller({ path: 'audit-logs', version: '1' })
export class AuditController {
  constructor(private readonly svc: AuditService) {}

  @Get()
  findAll(
    @Query('resource') resource?: string,
    @Query('performedBy') performedBy?: string,
    @Query('action') action?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.svc.findAll({ resource, performedBy, action, page: +page, limit: +limit });
  }
}
