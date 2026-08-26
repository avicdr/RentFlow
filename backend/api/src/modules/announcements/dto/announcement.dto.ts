import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  targetRole?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  expiresInDays?: number;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
