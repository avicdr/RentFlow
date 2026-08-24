import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  PAYMENT_REJECTED = 'PAYMENT_REJECTED',
  COMPLAINT_UPDATE = 'COMPLAINT_UPDATE',
  VISIT_CONFIRMED = 'VISIT_CONFIRMED',
  VISIT_CANCELLED = 'VISIT_CANCELLED',
  GENERAL = 'GENERAL',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true }) title: string;
  @Prop({ required: true }) body: string;
  @Prop({ type: Object, default: {} }) data: Record<string, string>;
  @Prop({ default: false }) isRead: boolean;
  @Prop({ default: false }) isDeleted: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90-day TTL
