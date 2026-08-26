import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'announcements', version: '1' })
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('role') role: string) {
    return this.announcementsService.findAll(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
