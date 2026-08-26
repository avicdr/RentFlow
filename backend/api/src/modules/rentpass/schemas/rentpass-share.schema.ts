import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RentPassShareDocument = RentPassShare & Document;

@Schema({ timestamps: true, collection: 'rentpass_shares' })
export class RentPassShare {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant', index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  token: string;

  @Prop({ default: 'Public Share Link' })
  label: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop({
    type: {
      showScore: { type: Boolean, default: true },
      showRentalHistory: { type: Boolean, default: true },
      showKYCStatus: { type: Boolean, default: true },
      showPaymentConsistency: { type: Boolean, default: true },
    },
    default: {},
  })
  privacySettings: {
    showScore: boolean;
    showRentalHistory: boolean;
    showKYCStatus: boolean;
    showPaymentConsistency: boolean;
  };

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop()
  lastViewedAt?: Date;
}

export const RentPassShareSchema = SchemaFactory.createForClass(RentPassShare);
RentPassShareSchema.index({ token: 1 });
RentPassShareSchema.index({ userId: 1, isRevoked: 1 });
