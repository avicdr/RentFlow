import { IsString, IsOptional, IsEnum, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiateDigiLockerDto {
  @ApiProperty({ example: 'AADHAAR', required: false, enum: ['AADHAAR', 'PAN', 'DRIVING_LICENSE'] })
  @IsOptional()
  @IsEnum(['AADHAAR', 'PAN', 'DRIVING_LICENSE'])
  documentType?: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE';

  @ApiProperty({ example: 'http://localhost:3004/kyc', required: false })
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}

export class VerifyDigiLockerOtpDto {
  @ApiProperty({ example: 'sess_9f823a1b4e' })
  @IsString()
  sessionId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: '987654321012', required: false })
  @IsOptional()
  @IsString()
  aadhaarNumber?: string;
}

export class DigiLockerCallbackDto {
  @ApiProperty({ example: 'code_auth_sample_123' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'state_nonce_456' })
  @IsString()
  state: string;
}
