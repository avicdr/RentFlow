import { Module } from '@nestjs/common';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Bed, BedSchema } from './schemas/bed.schema';

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
  imports: [
    MongooseModule.forFeature([{ name: Bed.name, schema: BedSchema }]),
  ],
  controllers: [BedsController],
  providers: [BedsService],
  exports: [BedsService, MongooseModule],
})
export class BedsModule {}
