import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ManagerAssignmentStatus } from '../schemas/property-manager-assignment.schema';

export class ManagerPermissionsDto {
  @IsOptional() @IsBoolean() viewTenants?: boolean;
  @IsOptional() @IsBoolean() manageTenants?: boolean;

  @IsOptional() @IsBoolean() viewRooms?: boolean;
  @IsOptional() @IsBoolean() manageRooms?: boolean;

  @IsOptional() @IsBoolean() viewPayments?: boolean;
  @IsOptional() @IsBoolean() recordPayments?: boolean;

  @IsOptional() @IsBoolean() viewMaintenance?: boolean;
  @IsOptional() @IsBoolean() manageMaintenance?: boolean;

  @IsOptional() @IsBoolean() viewDocuments?: boolean;
  @IsOptional() @IsBoolean() uploadDocuments?: boolean;

  @IsOptional() @IsBoolean() viewProperty?: boolean;
  @IsOptional() @IsBoolean() editProperty?: boolean;
  @IsOptional() @IsBoolean() deleteProperty?: boolean;

  @IsOptional() @IsBoolean() manageSettings?: boolean;
}

export class InvitePropertyManagerDto {
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  propertyIds: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerPermissionsDto)
  permissions?: ManagerPermissionsDto;
}

export class AssignPropertiesDto {
  @IsArray()
  @IsString({ each: true })
  propertyIds: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ManagerPermissionsDto)
  permissions?: ManagerPermissionsDto;
}

export class UpdateManagerPermissionsDto {
  @ValidateNested()
  @Type(() => ManagerPermissionsDto)
  permissions: ManagerPermissionsDto;
}

export class AcceptManagerInviteDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  password?: string;
}
