import { Controller, Get, Post, Patch, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get('stats')
  getStats() {
    return this.svc.getPlatformStats().then(data => ({ data }));
  }

  @Get('users')
  getUsers(@Query() query: any) {
    return this.svc.getUsers(query);
  }

  @Patch('users/:id/suspend')
  suspendUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.svc.suspendUser(id, adminId);
  }

  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.svc.activateUser(id, adminId);
  }

  @Get('kyc/pending')
  getPendingKyc(@Query() query: any) {
    return this.svc.getPendingKyc(query);
  }

  @Post('kyc/:id/approve')
  approveKyc(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.svc.approveKyc(id, adminId);
  }

  @Post('kyc/:id/reject')
  rejectKyc(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() body: { reason?: string },
  ) {
    return this.svc.rejectKyc(id, adminId, body?.reason);
  }

  @Get('properties')
  getProperties(@Query() query: any) {
    return this.svc.getAllProperties(query);
  }
}
