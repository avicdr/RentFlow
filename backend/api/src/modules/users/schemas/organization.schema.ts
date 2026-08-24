import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) ownerId: Types.ObjectId;
  @Prop({ type: String, enum: ['SOLO', 'GROWTH', 'SCALE', 'ENTERPRISE'], default: 'SOLO' }) tier: string;
  @Prop({ default: 1 }) propertyLimit: number;
  @Prop({ type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL'], default: 'ACTIVE' }) subscriptionStatus: string;
  @Prop() subscriptionExpiresAt?: Date;
  @Prop({ default: false }) isDeleted: boolean;
  @Prop() deletedAt?: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ ownerId: 1, isDeleted: 1 });
