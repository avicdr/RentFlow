import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateComplaintDto } from './dto/complaint.dto';

@ApiTags('Complaints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'complaints', version: '1' })
export class ComplaintsController {
  constructor(private readonly svc: ComplaintsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateComplaintDto) {
    return this.svc.create(user.id, user.role, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('propertyId') propertyId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findAll(user.id, user.role, { status, priority, category, propertyId, page: +page, limit: +limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { status: string; note?: string },
  ) {
    return this.svc.updateStatus(id, user.id, user.role, body.status, body.note);
  }
}
