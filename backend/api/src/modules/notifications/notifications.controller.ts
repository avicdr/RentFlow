import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('isRead') isRead?: string,
  ) {
    const read = isRead !== undefined ? isRead === 'true' : undefined;
    return this.svc.findAll(userId, +page, +limit, read);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string) {
    return this.svc.getUnreadCount(userId).then(count => ({ data: { count } }));
  }

  @Patch('read-all')
  readAll(@CurrentUser('id') userId: string) {
    return this.svc.markAllRead(userId);
  }

  @Patch('mark-all-read')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.svc.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.markRead(id, userId);
  }
}
