import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReliabilityScoreDocument = ReliabilityScore & Document;

@Schema({ timestamps: true, collection: 'reliability_scores' })
export class ReliabilityScore {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant', unique: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 100, default: 85 })
  currentScore: number;

  @Prop({ default: 85 })
  previousScore: number;

  @Prop({
    type: {
      paymentHistory: { type: Number, default: 90 },
      kycVerification: { type: Number, default: 80 },
      tenancyStability: { type: Number, default: 85 },
      outstandingDues: { type: Number, default: 95 },
      agreementStatus: { type: Number, default: 90 },
    },
    default: {},
  })
  breakdown: {
    paymentHistory: number;
    kycVerification: number;
    tenancyStability: number;
    outstandingDues: number;
    agreementStatus: number;
  };

  @Prop({ type: [String], default: [] })
  positiveFactors: string[];

  @Prop({ type: [String], default: [] })
  negativeFactors: string[];

  @Prop({
    type: [
      {
        timestamp: { type: Date, default: Date.now },
        previousScore: Number,
        newScore: Number,
        delta: Number,
        reason: String,
      },
    ],
    default: [],
  })
  events: Array<{
    timestamp: Date;
    previousScore: number;
    newScore: number;
    delta: number;
    reason: string;
  }>;

  @Prop({ default: Date.now })
  lastCalculatedAt: Date;
}

export const ReliabilityScoreSchema = SchemaFactory.createForClass(ReliabilityScore);
ReliabilityScoreSchema.index({ userId: 1 });
