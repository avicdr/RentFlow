import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaseDocument = Lease & Document;

@Schema({ collection: 'leases', timestamps: true })
export class Lease {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  landlordId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room' })
  roomId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ required: true, min: 0 })
  monthlyRent: number;

  @Prop({ default: 0, min: 0 })
  securityDeposit: number;

  @Prop({ default: 30 })
  noticePeriodDays: number;

  @Prop()
  terms: string;

  @Prop()
  specialClauses: string;

  @Prop({ type: String, enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED'], default: 'DRAFT' })
  status: string;

  @Prop()
  documentPath: string;  // uploaded signed PDF

  @Prop()
  signedAt: Date;

  @Prop()
  terminatedAt: Date;

  @Prop()
  terminationReason: string;

  @Prop({ type: Object })
  signedBy: {
    tenantName: string;
    landlordName: string;
    tenantSignedAt?: Date;
    landlordSignedAt?: Date;
  };

  @Prop({ type: Object })
  renewedFrom: {
    leaseId: Types.ObjectId;
    previousEndDate: Date;
  };

  @Prop({ type: [Types.ObjectId], ref: 'Document' })
  attachments: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const LeaseSchema = SchemaFactory.createForClass(Lease);

LeaseSchema.index({ tenantId: 1, status: 1 });
LeaseSchema.index({ landlordId: 1, status: 1 });
LeaseSchema.index({ propertyId: 1, status: 1 });
