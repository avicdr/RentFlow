import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messages & Communication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'messages', version: '1' })
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Get('conversations')
  getConversations(@CurrentUser('id') userId: string) {
    return this.svc.getConversations(userId);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.svc.getUnreadCount(userId);
  }

  @Get('conversations/:id')
  getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getMessages(id, userId, { page: page ? +page : 1, limit: limit ? +limit : 50 });
  }

  @Post('send')
  sendMessage(@CurrentUser('id') userId: string, @Body() dto: SendMessageDto) {
    return this.svc.sendMessage(userId, dto);
  }
}
