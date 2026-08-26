import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RentPassService } from './rentpass.service';
import { CreateRentPassShareDto } from './dto/rentpass.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('RentPass')
@Controller({ path: 'rentpass', version: '1' })
export class RentPassController {
  constructor(private readonly svc: RentPassService) {}

  // ── Public Unauthenticated Endpoint for shared link ────────
  @Get('public/:token')
  getPublicRentPass(@Param('token') token: string) {
    return this.svc.getPublicRentPass(token);
  }

  // ── Protected Tenant Endpoints ──────────────────────────────
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TENANT')
  getMyRentPass(@CurrentUser('id') userId: string) {
    return this.svc.getRentPassByUser(userId).then(data => ({ data }));
  }

  @Post('share')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TENANT')
  createShareLink(@CurrentUser('id') userId: string, @Body() dto: CreateRentPassShareDto) {
    return this.svc.createShareLink(userId, dto);
  }

  @Get('shares')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TENANT')
  getMyShares(@CurrentUser('id') userId: string) {
    return this.svc.getMyShareLinks(userId);
  }

  @Delete('shares/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TENANT')
  revokeShare(@CurrentUser('id') userId: string, @Param('id') shareId: string) {
    return this.svc.revokeShareLink(userId, shareId);
  }
}
