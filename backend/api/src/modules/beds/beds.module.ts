import { Module } from '@nestjs/common';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Injectable()
class BedsService {}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LANDLORD', 'PROPERTY_MANAGER')
@Controller({ path: 'beds', version: '1' })
class BedsController {
  constructor(private svc: BedsService) {}
  @Get() findAll() { return { data: [] }; }
}

@Module({
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService],
})
export class BedsModule {}
