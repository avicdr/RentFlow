import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Conversation', index: true })
  conversationId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  senderId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  receiverId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });
