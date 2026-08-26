import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UtilityBillDocument = UtilityBill & Document;

export enum UtilityType {
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  GAS = 'GAS',
  INTERNET = 'INTERNET',
  OTHER = 'OTHER',
}

export enum UtilityStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

@Schema({ timestamps: true, collection: 'utility_bills' })
export class UtilityBill {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  landlordId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', default: null })
  roomId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true, default: null })
  tenantId?: Types.ObjectId | null;

  @Prop({ required: true, type: String, enum: UtilityType, default: UtilityType.ELECTRICITY })
  type: UtilityType;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  billingPeriod: string; // e.g. "June 2026"

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ type: String, enum: UtilityStatus, default: UtilityStatus.PENDING })
  status: UtilityStatus;

  @Prop()
  paidAt?: Date;

  @Prop({ default: '' })
  documentUrl?: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const UtilityBillSchema = SchemaFactory.createForClass(UtilityBill);
UtilityBillSchema.index({ tenantId: 1, status: 1 });
UtilityBillSchema.index({ propertyId: 1, dueDate: -1 });
UtilityBillSchema.index({ landlordId: 1, status: 1 });
