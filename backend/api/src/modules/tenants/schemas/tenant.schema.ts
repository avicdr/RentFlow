import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true }) userId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) landlordId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' }) organizationId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' }) propertyId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Room' }) roomId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Bed', default: null }) bedId: Types.ObjectId | null;
  @Prop({ required: true }) joiningDate: Date;
  @Prop() vacatingDate?: Date;
  @Prop({ type: String, enum: ['ACTIVE', 'NOTICE_PERIOD', 'VACATED', 'BLACKLISTED'], default: 'ACTIVE' }) status: string;
  @Prop({ required: true }) agreedRent: number;
  @Prop({ required: true }) securityDeposit: number;
  @Prop({ required: true, min: 1, max: 31 }) rentDueDay: number;
  @Prop({ type: Types.ObjectId, ref: 'Document', default: null }) agreementDocumentId: Types.ObjectId | null;
  @Prop({ type: Object, default: {} }) emergencyContact: { name?: string; phone?: string; relation?: string };
  @Prop({ type: Object, default: { aadhaar: 'PENDING', police: 'NOT_REQUIRED' } }) verificationStatus: {
    aadhaar: 'PENDING' | 'VERIFIED' | 'REJECTED';
    police: 'PENDING' | 'VERIFIED' | 'NOT_REQUIRED';
  };
  @Prop({ type: Types.ObjectId, ref: 'Broker', default: null }) referredBy: Types.ObjectId | null;
  @Prop({ default: false }) isDeleted: boolean;
  @Prop() deletedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ landlordId: 1, status: 1 });
TenantSchema.index({ propertyId: 1, status: 1 });
// userId already has a unique index from `@Prop({ unique: true })` — no explicit duplicate here.
TenantSchema.index({ rentDueDay: 1, status: 1 });
