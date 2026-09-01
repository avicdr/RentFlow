import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoomAvailabilityEventDocument = RoomAvailabilityEvent & Document;

@Schema({ timestamps: true, collection: 'room_availability_events' })
export class RoomAvailabilityEvent {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Room', index: true })
  roomId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true })
  propertyId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  landlordId: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    enum: [
      'STATUS_CHANGE',
      'MAINTENANCE_START',
      'MAINTENANCE_END',
      'NOTICE_RECORDED',
      'NOTICE_CANCELLED',
      'MOVE_IN',
      'MOVE_OUT',
      'RESERVED',
      'UNRESERVED',
    ],
  })
  eventType: string;

  @Prop({ required: true })
  fromStatus: string;

  @Prop({ required: true })
  toStatus: string;

  @Prop()
  reason?: string;

  @Prop()
  notes?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  expectedEndDate?: Date;

  @Prop()
  actualEndDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  @Prop()
  actorRole?: string;
}

export const RoomAvailabilityEventSchema = SchemaFactory.createForClass(RoomAvailabilityEvent);
RoomAvailabilityEventSchema.index({ roomId: 1, createdAt: -1 });
RoomAvailabilityEventSchema.index({ propertyId: 1, createdAt: -1 });
