import {
  IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { APPLICATION_STATUSES, EMPLOYMENT_TYPES } from '../schemas/application.schema';

export class ApplicantEmploymentDto {
  @IsEnum(EMPLOYMENT_TYPES) type: 'SALARIED' | 'SELF_EMPLOYED' | 'STUDENT' | 'BUSINESS_OWNER' | 'OTHER';
  @IsOptional() @IsString() organization?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsNumber() @Min(0) monthlyIncome?: number;
  @IsOptional() @IsNumber() @Min(0) durationMonths?: number;
  @IsOptional() @IsString() workAddress?: string;
}

export class ApplicantReferenceDto {
  @IsString() name: string;
  @IsString() relation: string;
  @IsString() phone: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsNumber() durationMonths?: number;
  @IsOptional() @IsString() propertyAddress?: string;
}

export class CreateRentalApplicationDto {
  @IsString() propertyId: string;
  @IsString() roomId: string;
  @IsDateString() preferredMoveInDate: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicantEmploymentDto)
  employmentInfo?: ApplicantEmploymentDto;

  @IsOptional()
  incomeInfo?: {
    monthlyIncome?: number;
    incomeSource?: string;
    proofDocumentUrl?: string;
    proofDocumentName?: string;
  };

  @IsOptional()
  @IsString()
  rentPassShareToken?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicantReferenceDto)
  references?: ApplicantReferenceDto[];

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class UpdateApplicationStatusDto {
  @IsEnum(['SHORTLISTED', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'])
  status: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  landlordNotes?: string;
}
