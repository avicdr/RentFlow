import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true, collection: 'otps' })
export class Otp {
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) code: string;
  @Prop({ enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION'] })
  purpose: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: false }) isUsed: boolean;
  @Prop({ default: 0 }) attempts: number;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ email: 1, purpose: 1 });
