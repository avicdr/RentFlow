import { Module } from '@nestjs/common';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
class VisitsService {}

@UseGuards(JwtAuthGuard)
@Controller({ path: 'visits', version: '1' })
class VisitsController {
  constructor(private svc: VisitsService) {}
  @Get() findAll() { return { data: [], message: 'Visits module — full implementation in Phase 2' }; }
}

@Module({
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
