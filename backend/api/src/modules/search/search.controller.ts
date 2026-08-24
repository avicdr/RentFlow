import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly svc: SearchService) {}

  @Get()
  @ApiQuery({ name: 'q', required: true })
  globalSearch(@Query('q') q: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.svc.globalSearch(q, userId, role).then(data => ({ data }));
  }

  @Get('properties')
  propertySearch(@Query('q') q: string, @Query() filters: any, @CurrentUser('id') userId: string) {
    return this.svc.propertySearch(q, userId, filters).then(data => ({ data }));
  }

  @Get('tenants')
  tenantSearch(@Query('q') q: string, @CurrentUser('id') landlordId: string) {
    return this.svc.tenantSearch(q, landlordId).then(data => ({ data }));
  }

  @Get('users')
  adminSearch(@Query('q') q: string, @Query() filters: any, @CurrentUser('role') role: string) {
    if (role !== 'SUPER_ADMIN') return { data: [] };
    return this.svc.adminUserSearch(q, filters).then(data => ({ data }));
  }
}
