import { Module } from '@nestjs/common';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
class BrokersService {}

@UseGuards(JwtAuthGuard)
@Controller({ path: 'brokers', version: '1' })
class BrokersController {
  constructor(private svc: BrokersService) {}
  @Get() findAll() { return { data: [], message: 'Brokers module — full implementation in Phase 2' }; }
}

@Module({
  controllers: [BrokersController],
  providers: [BrokersService],
  exports: [BrokersService],
})
export class BrokersModule {}
