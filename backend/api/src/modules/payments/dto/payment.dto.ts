import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @ApiProperty() @IsString() @IsNotEmpty() tenantId: string;
  @ApiProperty() @IsString() @IsNotEmpty() propertyId: string;
  @ApiProperty() @IsNumber() @IsPositive() amount: number;
  @ApiProperty() @IsString() @IsNotEmpty() dueDate: string;
  @ApiProperty() @IsNumber() @Min(1) @Max(12) month: number;
  @ApiProperty() @IsNumber() year: number;
  @ApiProperty({ enum: PaymentType, required: false })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) latePenalty?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class SubmitPaymentDto {
  @ApiProperty() @IsString() @IsNotEmpty() screenshotPath: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  utrNumber: string;
  @ApiProperty({ enum: ['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'OTHER'] })
  @IsEnum(['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'OTHER'])
  paymentMethod: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() paymentApp?: string;
  @ApiProperty() @IsNumber() @IsPositive() paidAmount: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() note?: string;
}

export class ApprovePaymentDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() disputeNote?: string;
}

export class RejectPaymentDto {
  @ApiProperty() @IsString() @IsNotEmpty() reason: string;
}
