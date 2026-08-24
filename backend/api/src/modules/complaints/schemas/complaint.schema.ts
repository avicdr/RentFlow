import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ComplaintDocument = Complaint & Document;

@Schema({ timestamps: true, collection: 'complaints' })
export class Complaint {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) raisedBy: Types.ObjectId;
  @Prop({ type: String, enum: ['TENANT', 'LANDLORD'] }) raisedByRole: string;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true }) propertyId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Room', index: true }) roomId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) landlordId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' }) organizationId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) description: string;
  @Prop({ type: String, enum: ['MAINTENANCE', 'NOISE', 'BILLING', 'SAFETY', 'HARASSMENT', 'OTHER', 'PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'PEST', 'WIFI'] }) category: string;
  @Prop({ type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' }) priority: string;
  @Prop({ type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'], default: 'OPEN' }) status: string;
  @Prop({ type: [String], default: [] }) attachments: string[];
  @Prop({ type: Types.ObjectId, ref: 'User', default: null }) assignedTo: Types.ObjectId | null;
  @Prop() resolvedAt?: Date;
  @Prop({ default: '' }) resolutionNote: string;
  @Prop({ type: [Object], default: [] }) timeline: Array<{
    action: string; performedBy: Types.ObjectId; note?: string; timestamp: Date;
  }>;
  @Prop({ default: false }) isDeleted: boolean;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);
ComplaintSchema.index({ landlordId: 1, status: 1, createdAt: -1 });
ComplaintSchema.index({ raisedBy: 1, status: 1 });
ComplaintSchema.index({ propertyId: 1, status: 1 });
