import {
  Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(private readonly svc: TenantsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  create(@CurrentUser() user: any, @Body() dto: CreateTenantDto) {
    return this.svc.create(user.id, user.role, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findAll(userId, { status, propertyId, page: +page, limit: +limit, role });
  }

  @Get('my-profile')
  @UseGuards(RolesGuard)
  @Roles('TENANT')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.svc.findByUser(userId);
  }

  @Get(':id/stay-history')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  getStayHistory(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.svc.getStayHistory(id, userId, role);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.svc.findOne(id, userId, role);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateTenantDto) {
    return this.svc.update(id, user.id, user.role, dto);
  }

  @Patch(':id/vacate')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  vacate(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { vacatingDate: string }) {
    return this.svc.vacate(id, user.id, user.role, body.vacatingDate);
  }
}

