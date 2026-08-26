import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancesService } from './finances.service';
import { CreateExpenseDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Finances & Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'finances', version: '1' })
export class FinancesController {
  constructor(private readonly svc: FinancesService) {}

  @Get('overview')
  getPortfolioOverview(@CurrentUser('id') userId: string) {
    return this.svc.getPortfolioOverview(userId).then(data => ({ data }));
  }

  @Get('properties/:id')
  getPropertyFinances(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.getPropertyFinances(id, userId).then(data => ({ data }));
  }

  @Get('expenses')
  getExpenses(
    @CurrentUser('id') userId: string,
    @Query('propertyId') propertyId?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.getExpenses(userId, { propertyId, category, startDate, endDate, page, limit });
  }

  @Post('expenses')
  createExpense(@CurrentUser('id') userId: string, @Body() dto: CreateExpenseDto) {
    return this.svc.createExpense(userId, dto);
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.svc.deleteExpense(id, userId);
  }

  @Get('reports')
  getAccountingReports(
    @CurrentUser('id') userId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.svc.getAccountingReports(userId, { year: year ? +year : undefined, month: month ? +month : undefined }).then(data => ({ data }));
  }
}
