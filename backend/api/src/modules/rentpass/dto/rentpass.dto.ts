import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRentPassShareDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() label?: string;
  @ApiProperty({ default: 30 }) @IsNumber() @Min(1) expiryDays: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() showScore?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() showRentalHistory?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() showKYCStatus?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() showPaymentConsistency?: boolean;
}
