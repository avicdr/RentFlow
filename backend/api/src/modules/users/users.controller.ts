import { Controller, Get, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') id: string) {
    return this.svc.findById(id);
  }

  @Put('me')
  updateMe(@CurrentUser('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.svc.updateProfile(id, dto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'LANDLORD')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.svc.softDelete(id, adminId);
  }
}
