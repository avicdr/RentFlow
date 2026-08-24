import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const CATEGORIES = ['MAINTENANCE', 'PLUMBING', 'ELECTRICAL', 'PEST_CONTROL', 'CLEANING', 'SECURITY', 'NOISE', 'OTHER'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

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
