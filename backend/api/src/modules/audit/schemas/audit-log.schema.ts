import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) performedBy: Types.ObjectId;
  @Prop({ required: true }) action: string;
  @Prop({ required: true }) resource: string;
  @Prop({ type: Types.ObjectId }) resourceId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) organizationId?: Types.ObjectId;
  @Prop({ type: Object }) before?: Record<string, unknown>;
  @Prop({ type: Object }) after?: Record<string, unknown>;
  @Prop({ type: Object, default: {} }) metadata: { ipAddress?: string; userAgent?: string };
  @Prop({ type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' }) severity: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });
