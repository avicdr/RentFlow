import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PropertyManagersService } from './property-managers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  InvitePropertyManagerDto,
  AssignPropertiesDto,
  UpdateManagerPermissionsDto,
} from './dto/property-manager.dto';

@ApiTags('Property Managers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'property-managers', version: '1' })
export class PropertyManagersController {
  constructor(private readonly svc: PropertyManagersService) {}

  /**
   * Owner: Invite a new or existing user as Property Manager
   */
  @Post('invite')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  inviteManager(@CurrentUser('id') landlordId: string, @Body() dto: InvitePropertyManagerDto) {
    return this.svc.inviteManager(landlordId, dto);
  }

  /**
   * Owner: List all property managers under this owner
   */
  @Get()
  @Roles('LANDLORD', 'SUPER_ADMIN')
  listLandlordManagers(@CurrentUser('id') landlordId: string) {
    return this.svc.listLandlordManagers(landlordId);
  }

  /**
   * Property Manager: Get properties assigned to the currently authenticated PM
   */
  @Get('my/assigned-properties')
  @Roles('PROPERTY_MANAGER', 'LANDLORD', 'SUPER_ADMIN')
  getMyAssignedProperties(@CurrentUser('id') userId: string) {
    return this.svc.getMyAssignedProperties(userId);
  }

  /**
   * Owner: Get details of a specific manager and their property assignments
   */
  @Get(':id')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  getManagerDetails(@Param('id') managerId: string, @CurrentUser('id') landlordId: string) {
    return this.svc.getManagerDetails(managerId, landlordId);
  }

  /**
   * Owner: Assign manager to additional properties
   */
  @Post(':id/assign')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  assignProperties(
    @Param('id') managerId: string,
    @CurrentUser('id') landlordId: string,
    @Body() dto: AssignPropertiesDto,
  ) {
    return this.svc.assignProperties(managerId, landlordId, dto);
  }

  /**
   * Owner: Remove manager from a specific property
   */
  @Delete(':id/properties/:propertyId')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  removePropertyAssignment(
    @Param('id') managerId: string,
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') landlordId: string,
  ) {
    return this.svc.removePropertyAssignment(managerId, propertyId, landlordId);
  }

  /**
   * Owner: Update permissions for a specific property assignment
   */
  @Patch(':id/properties/:propertyId/permissions')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  updatePermissions(
    @Param('id') managerId: string,
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') landlordId: string,
    @Body() dto: UpdateManagerPermissionsDto,
  ) {
    return this.svc.updatePermissions(managerId, propertyId, landlordId, dto);
  }

  /**
   * Owner: Resend invite to a manager
   */
  @Post(':id/resend-invite')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  resendInvite(@Param('id') managerId: string, @CurrentUser('id') landlordId: string) {
    return this.svc.resendInvite(managerId, landlordId);
  }

  /**
   * Owner: Deactivate/revoke manager access across all owner properties
   */
  @Post(':id/deactivate')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  deactivateManager(@Param('id') managerId: string, @CurrentUser('id') landlordId: string) {
    return this.svc.deactivateManager(managerId, landlordId);
  }

  /**
   * Owner: Get all managers assigned to a specific property
   */
  @Get('properties/:propertyId/managers')
  @Roles('LANDLORD', 'SUPER_ADMIN')
  getManagersForProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser('id') landlordId: string,
  ) {
    return this.svc.getManagersForProperty(propertyId, landlordId);
  }
}
