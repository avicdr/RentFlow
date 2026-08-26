import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() conversationId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() receiverId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() content: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() @IsString({ each: true }) attachments?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() propertyId?: string;
}
