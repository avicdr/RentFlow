import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UtilitiesService } from './utilities.service';
import { CreateUtilityBillDto, UpdateUtilityBillDto } from './dto/utility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Utilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'utilities', version: '1' })
export class UtilitiesController {
  constructor(private readonly svc: UtilitiesService) {}

  @Get('my-bills')
  @Roles('TENANT')
  getMyBills(@CurrentUser('id') userId: string, @Query('type') type?: string, @Query('status') status?: string) {
    return this.svc.findMyBills(userId, { type, status });
  }

  @Get()
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  findAll(
    @CurrentUser('id') userId: string,
    @Query('propertyId') propertyId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAllForLandlord(userId, { propertyId, type, status, page, limit });
  }

  @Post()
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateUtilityBillDto) {
    return this.svc.create(userId, dto);
  }

  @Patch(':id')
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateUtilityBillDto) {
    return this.svc.updateStatus(id, userId, dto);
  }

  @Delete(':id')
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.delete(id, userId);
  }
}
