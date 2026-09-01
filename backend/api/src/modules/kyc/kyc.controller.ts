import {
  Controller, Get, Post, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InitiateDigiLockerDto, VerifyDigiLockerOtpDto } from './dto/digilocker.dto';

@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'kyc', version: '1' })
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiOperation({ summary: 'Initiate DigiLocker identity verification session' })
  @Post('digilocker/initiate')
  initiate(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiateDigiLockerDto,
  ) {
    return this.kycService.initiateDigiLocker(userId, dto);
  }

  @ApiOperation({ summary: 'Verify DigiLocker OTP and complete identity verification' })
  @Post('digilocker/verify')
  verifyOtp(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyDigiLockerOtpDto,
  ) {
    return this.kycService.verifyDigiLockerOtp(userId, dto);
  }

  @ApiOperation({ summary: 'Get current user KYC and DigiLocker verification status' })
  @Get('status')
  getStatus(@CurrentUser('id') userId: string) {
    return this.kycService.getKycStatus(userId);
  }
}
