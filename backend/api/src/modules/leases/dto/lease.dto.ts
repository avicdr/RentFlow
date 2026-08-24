import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString,
  IsMongoId, Min, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeaseDto {
  @ApiProperty() @IsMongoId() tenantId: string;
  @ApiProperty() @IsMongoId() userId: string;
  @ApiProperty() @IsMongoId() propertyId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsMongoId() roomId?: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() endDate?: string;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) monthlyRent: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Type(() => Number) securityDeposit?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) @Type(() => Number) noticePeriodDays?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() terms?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() specialClauses?: string;
}
