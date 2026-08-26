import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ required: true, type: [{ type: Types.ObjectId, ref: 'User' }], index: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Property', default: null })
  propertyId?: Types.ObjectId | null;

  @Prop({
    type: {
      text: String,
      senderId: { type: Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
    },
    default: null,
  })
  lastMessage?: {
    text: string;
    senderId: Types.ObjectId;
    timestamp: Date;
  };

  @Prop({ type: Object, default: {} })
  unreadCounts: Record<string, number>;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ updatedAt: -1 });
