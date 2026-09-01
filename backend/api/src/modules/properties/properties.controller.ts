import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { RoomsService } from '../rooms/rooms.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePropertyDto, UpdatePropertyDto, UpdatePaymentMethodsDto } from './dto/property.dto';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'properties', version: '1' })
export class PropertiesController {
  constructor(
    private readonly svc: PropertiesService,
    private readonly roomsSvc: RoomsService,
  ) {}

  @Post()
  @Roles('LANDLORD', 'SUPER_ADMIN')
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePropertyDto) {
    return this.svc.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('listingStatus') listingStatus?: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findAll(user.id, user.role, { search, status, listingStatus, type, page: +page, limit: +limit });
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.svc.getStats(user.id, user.role).then(s => ({ data: s[0] ?? {} }));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.findOne(id, user.id, user.role);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.publish(id, user.id, user.role);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.unpublish(id, user.id, user.role);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdatePropertyDto) {
    return this.svc.update(id, user.id, user.role, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdatePropertyDto) {
    return this.svc.update(id, user.id, user.role, dto);
  }

  @Get(':id/rooms')
  getRooms(@Param('id') id: string, @CurrentUser() user: any) {
    return this.roomsSvc.findByProperty(id, user.id, user.role).then(d => ({ data: d }));
  }

  @Get(':id/tenants')
  getTenants(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.getTenants(id, user.id, user.role);
  }

  @Patch(':id/payment-methods')
  updatePaymentMethods(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdatePaymentMethodsDto) {
    return this.svc.updatePaymentMethods(id, user.id, user.role, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.remove(id, user.id, user.role);
  }
}

