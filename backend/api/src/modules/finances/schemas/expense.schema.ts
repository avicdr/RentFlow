import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyExpenseDocument = PropertyExpense & Document;

export enum ExpenseCategory {
  MAINTENANCE = 'MAINTENANCE',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  INTERNET = 'INTERNET',
  SOCIETY_CHARGES = 'SOCIETY_CHARGES',
  REPAIRS = 'REPAIRS',
  PAINTING = 'PAINTING',
  PLUMBING = 'PLUMBING',
  APPLIANCES = 'APPLIANCES',
  PROPERTY_TAX = 'PROPERTY_TAX',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true, collection: 'property_expenses' })
export class PropertyExpense {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  landlordId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', default: null })
  roomId?: Types.ObjectId | null;

  @Prop({ required: true, type: String, enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  receiptUrl?: string;

  @Prop({ default: false })
  isRecurring: boolean;

  @Prop({ type: String, enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'], default: null })
  recurringInterval?: string | null;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PropertyExpenseSchema = SchemaFactory.createForClass(PropertyExpense);
PropertyExpenseSchema.index({ landlordId: 1, date: -1 });
PropertyExpenseSchema.index({ propertyId: 1, date: -1 });
PropertyExpenseSchema.index({ landlordId: 1, category: 1 });
