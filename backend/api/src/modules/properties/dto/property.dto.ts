import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray,
  IsBoolean, Min, IsObject, IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'PG', 'HOSTEL', 'VILLA', 'COMMERCIAL', 'PLOT', 'OTHER'] as const;
const PROPERTY_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;

export class CreatePropertyDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ enum: PROPERTY_TYPES }) @IsEnum(PROPERTY_TYPES) type: string;
  @ApiProperty() @IsString() @IsNotEmpty() address: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() state?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() pincode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() country?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Type(() => Number) totalFloors?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsObject() location?: { lat: number; lng: number };
}

export class UpdatePropertyDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEnum(PROPERTY_TYPES) type?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() state?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() pincode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() country?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Type(() => Number) totalFloors?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEnum(PROPERTY_STATUSES) status?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() @IsString({ each: true }) amenities?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsObject() location?: { lat: number; lng: number };
}

export class UpdatePaymentMethodsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() upi?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() bankTransfer?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() cash?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() razorpay?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() upiId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() bankAccount?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() ifsc?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() accountName?: string;
}
