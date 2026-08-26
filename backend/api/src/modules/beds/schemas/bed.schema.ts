import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BedDocument = Bed & Document;

@Schema({ timestamps: true, collection: 'beds' })
export class Bed {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: true })
  roomId: Types.ObjectId;

  @Prop({ required: true })
  bedNumber: string;

  @Prop({ default: 'AVAILABLE', enum: ['AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE'] })
  status: string;

  @Prop({ default: 0 })
  rentPerMonth: number;
}

export const BedSchema = SchemaFactory.createForClass(Bed);
