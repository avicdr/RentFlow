import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UtilityType, UtilityStatus } from '../schemas/utility-bill.schema';

export class CreateUtilityBillDto {
  @ApiProperty() @IsString() @IsNotEmpty() propertyId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() roomId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() tenantId?: string;
  @ApiProperty({ enum: UtilityType }) @IsEnum(UtilityType) type: UtilityType;
  @ApiProperty() @IsNumber() @IsPositive() amount: number;
  @ApiProperty() @IsString() @IsNotEmpty() billingPeriod: string;
  @ApiProperty() @IsDateString() dueDate: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() documentUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class UpdateUtilityBillDto {
  @ApiProperty({ enum: UtilityStatus, required: false }) @IsOptional() @IsEnum(UtilityStatus) status?: UtilityStatus;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
