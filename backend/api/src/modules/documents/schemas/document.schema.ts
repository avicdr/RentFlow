import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongoDocument, Types } from 'mongoose';

export type DocumentDocument = DocModel & MongoDocument;

@Schema({ timestamps: true, collection: 'documents' })
export class DocModel {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) uploadedBy: Types.ObjectId;
  @Prop({ required: true }) filePath: string;
  @Prop({ required: true }) originalName: string;
  @Prop({ required: true }) mimeType: string;
  @Prop({ required: true }) sizeBytes: number;
  @Prop({ required: true }) category: string;
  @Prop({ type: Types.ObjectId, default: null }) relatedTo: Types.ObjectId | null;
  @Prop({ default: '' }) relatedModel: string;
  @Prop({ default: '' }) description: string;
  @Prop({ type: String, enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'], default: 'APPROVED' }) status: string;
  @Prop({ default: false }) isDeleted: boolean;
}

export const DocumentSchema = SchemaFactory.createForClass(DocModel);
DocumentSchema.index({ uploadedBy: 1, category: 1, createdAt: -1 });
