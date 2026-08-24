import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
  Req, Res, StreamableFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as fs from 'fs';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, SubmitPaymentDto, ApprovePaymentDto, RejectPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePaymentDto) {
    return this.svc.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('tenantId') tenantId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.findAll(user.id, user.role, { status, month, year, tenantId, page: +page, limit: +limit });
  }

  @Get('pending-review')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  getPendingReview(@CurrentUser('id') userId: string) {
    return this.svc.getPendingReview(userId).then(data => ({ data }));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.findOne(id, user.id, user.role);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('TENANT')
  submit(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitPaymentDto,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? req.socket.remoteAddress ?? '';
    return this.svc.submit(id, userId, dto, ip);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  approve(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: ApprovePaymentDto) {
    return this.svc.approve(id, userId, dto);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  reject(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: RejectPaymentDto) {
    return this.svc.reject(id, userId, dto);
  }

  @Patch(':id/under-review')
  @UseGuards(RolesGuard)
  @Roles('LANDLORD', 'PROPERTY_MANAGER')
  setUnderReview(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.setUnderReview(id, userId);
  }

  @Get(':id/receipt')
  async downloadReceipt(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const receipt = await this.svc.getReceipt(id, user.id, user.role);
    const file = fs.createReadStream(receipt.pdfPath);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${receipt.receiptId}.pdf"`,
    });
    return new StreamableFile(file);
  }
}
