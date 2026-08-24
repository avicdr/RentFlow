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
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTenantDto) {
    return this.svc.create(userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findAll(userId, { status, propertyId, page: +page, limit: +limit });
  }

  @Get('my-profile')
  @UseGuards(RolesGuard)
  @Roles('TENANT')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.svc.findByUser(userId);
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
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateTenantDto) {
    return this.svc.update(id, userId, dto);
  }

  @Patch(':id/vacate')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  vacate(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: { vacatingDate: string }) {
    return this.svc.vacate(id, userId, body.vacatingDate);
  }
}
