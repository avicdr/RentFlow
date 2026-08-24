import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LeasesService } from './leases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateLeaseDto } from './dto/lease.dto';

@ApiTags('Leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'leases', version: '1' })
export class LeasesController {
  constructor(private readonly svc: LeasesService) {}

  @Post()
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  create(@Body() dto: CreateLeaseDto, @CurrentUser('id') landlordId: string) {
    return this.svc.create(dto, landlordId).then(d => ({ data: d }));
  }

  @Get()
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  findByLandlord(@CurrentUser('id') landlordId: string, @Query() query: any) {
    return this.svc.findByLandlord(landlordId, query).then(d => ({ data: d }));
  }

  @Get('my-lease')
  @Roles('TENANT')
  getMyActiveLease(@CurrentUser('id') tenantId: string) {
    return this.svc.getActiveLease(tenantId).then(d => ({ data: d }));
  }

  @Get(':id')
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'TENANT', 'SUPER_ADMIN')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.findById(id, user.id, user.role).then(d => ({ data: d }));
  }

  @Patch(':id/activate')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.activate(id, user.id, user.role).then(d => ({ data: d }));
  }

  @Patch(':id/attach-document')
  @Roles('LANDLORD', 'TENANT', 'SUPER_ADMIN')
  attachDocument(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('documentPath') documentPath: string,
  ) {
    return this.svc.attachDocument(id, user.id, user.role, documentPath).then(d => ({ data: d }));
  }

  @Patch(':id/terminate')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  terminate(@Param('id') id: string, @CurrentUser() user: any, @Body('reason') reason: string) {
    return this.svc.terminate(id, user.id, user.role, reason).then(d => ({ data: d }));
  }
}
