import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '../schemas/expense.schema';

export class CreateExpenseDto {
  @ApiProperty() @IsString() @IsNotEmpty() propertyId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() roomId?: string;
  @ApiProperty({ enum: ExpenseCategory }) @IsEnum(ExpenseCategory) category: ExpenseCategory;
  @ApiProperty() @IsNumber() @IsPositive() amount: number;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() receiptUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isRecurring?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() recurringInterval?: string;
}

export class UpdateExpenseDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() propertyId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() roomId?: string;
  @ApiProperty({ enum: ExpenseCategory, required: false }) @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @IsPositive() amount?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() date?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() receiptUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isRecurring?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() recurringInterval?: string;
}
