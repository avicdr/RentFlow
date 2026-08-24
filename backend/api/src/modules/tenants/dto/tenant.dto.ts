import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsEmail,
  IsDateString, IsObject, Min, IsMongoId, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @IsNotEmpty() firstName: string;
  @ApiProperty() @IsString() @IsNotEmpty() lastName: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsMongoId() propertyId: string;
  @ApiProperty() @IsMongoId() roomId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsMongoId() bedId?: string;
  @ApiProperty() @IsDateString() joiningDate: string;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) agreedRent: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Type(() => Number) securityDeposit?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Type(() => Number) rentDueDay?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() emergencyContact?: Record<string, string>;
  @ApiProperty({ required: false }) @IsOptional() @IsMongoId() referredBy?: string;
}

export class UpdateTenantDto {
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Type(() => Number) agreedRent?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Type(() => Number) securityDeposit?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Type(() => Number) rentDueDay?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() emergencyContact?: Record<string, string>;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
