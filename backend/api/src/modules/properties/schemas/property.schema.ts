import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true, collection: 'properties' })
export class Property {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) landlordId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization', index: true }) organizationId: Types.ObjectId;
  @Prop({ required: true, trim: true }) name: string;
  @Prop({ default: '' }) description: string;
  @Prop({ type: String, enum: ['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL'], required: true }) type: string;
  @Prop({ type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DRAFT'], default: 'DRAFT' }) status: string;
  @Prop({ required: true, type: Object }) address: {
    line1: string; line2?: string; city: string;
    state: string; pincode: string; country: string;
  };
  @Prop({ type: Object, default: {} }) amenities: {
    wifi?: boolean; parking?: boolean; cctv?: boolean;
    security?: boolean; laundry?: boolean; gym?: boolean;
    powerBackup?: boolean; waterSupply?: string;
  };
  @Prop({ type: [String], default: [] }) images: string[];
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) managedBy: Types.ObjectId[];
  @Prop({ type: Types.ObjectId, ref: 'User', default: null }) assignedBroker: Types.ObjectId | null;
  @Prop({ default: 0 }) totalRooms: number;
  @Prop({ default: 0 }) totalBeds: number;
  @Prop({ default: 0 }) occupiedBeds: number;
  @Prop({ default: false }) isListed: boolean;
  @Prop({ type: Object, default: null }) paymentMethods: {
    upiId?: string;
    qrCodePath?: string;
    bankAccount?: { bankName: string; accountNumber: string; ifsc: string; accountHolder: string };
    paymentPhone?: string;
    instructions?: string;
  } | null;
  @Prop({ type: String, enum: ['NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'], default: 'NOT_VERIFIED' })
  verificationStatus: string;
  @Prop({ default: false })
  isVerified: boolean;
  @Prop({
    type: {
      status: { type: String, enum: ['NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'], default: 'NOT_VERIFIED' },
      verifiedAt: Date,
      verifiedBy: { type: Types.ObjectId, ref: 'User' },
      notes: String,
      documents: [String],
    },
    default: null,
  })
  verificationDetails?: {
    status: string;
    verifiedAt?: Date;
    verifiedBy?: Types.ObjectId;
    notes?: string;
    documents?: string[];
  } | null;
  @Prop({ default: false }) isDeleted: boolean;
  @Prop() deletedAt?: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ landlordId: 1, status: 1 });
PropertySchema.index({ organizationId: 1, isDeleted: 1 });
PropertySchema.index({ 'address.city': 1, type: 1, status: 1 });
PropertySchema.index({ isListed: 1, status: 1 });
