import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateRentalApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Rental Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'applications', version: '1' })
export class ApplicationsController {
  constructor(private readonly svc: ApplicationsService) {}

  // ── Tenant Endpoints ──────────────────────────────────────────────────────

  @Post()
  submitApplication(@CurrentUser('id') userId: string, @Body() dto: CreateRentalApplicationDto) {
    return this.svc.submitApplication(userId, dto);
  }

  @Get('my')
  getMyApplications(@CurrentUser('id') userId: string) {
    return this.svc.getMyApplications(userId);
  }

  @Get('my/:id')
  getMyApplication(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.getMyApplication(id, userId);
  }

  @Post('my/:id/withdraw')
  withdrawApplication(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.withdrawApplication(id, userId);
  }

  // ── Landlord Endpoints ────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  @Get('landlord')
  getLandlordApplications(
    @CurrentUser('id') landlordId: string,
    @Query('propertyId') propertyId?: string,
    @Query('roomId') roomId?: string,
    @Query('status') status?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.getLandlordApplications(landlordId, { propertyId, roomId, status, kycStatus, search });
  }

  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  @Get('landlord/:id')
  getLandlordApplication(@Param('id') id: string, @CurrentUser('id') landlordId: string) {
    return this.svc.getLandlordApplication(id, landlordId);
  }

  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
  @Patch('landlord/:id/status')
  updateApplicationStatus(
    @Param('id') id: string,
    @CurrentUser('id') landlordId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.svc.updateApplicationStatus(id, landlordId, dto);
  }
}
