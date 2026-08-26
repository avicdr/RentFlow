import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true, collection: 'announcements' })
export class Announcement {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ default: 'ALL', enum: ['ALL', 'LANDLORD', 'TENANT', 'BROKER', 'PROPERTY_MANAGER'] })
  targetRole: string;

  @Prop({ default: 'INFO', enum: ['INFO', 'WARNING', 'MAINTENANCE', 'FEATURE'] })
  type: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  pinned: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdById: Types.ObjectId | null;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index({ expiresAt: 1, isDeleted: 1 });
AnnouncementSchema.index({ targetRole: 1, isDeleted: 1 });
AnnouncementSchema.index({ pinned: -1, createdAt: -1 });
