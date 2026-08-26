import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const CATEGORIES = ['MAINTENANCE', 'NOISE', 'BILLING', 'SAFETY', 'HARASSMENT', 'OTHER', 'PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'PEST', 'WIFI'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export class CreateComplaintDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEnum(CATEGORIES) category?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEnum(PRIORITIES) priority?: string;
  @ApiProperty() @IsMongoId() landlordId: string;
  @ApiProperty() @IsMongoId() propertyId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsMongoId() roomId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() @IsString({ each: true }) attachments?: string[];
}
