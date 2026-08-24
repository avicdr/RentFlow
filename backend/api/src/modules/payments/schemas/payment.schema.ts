import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export enum PaymentType {
  RENT = 'RENT',
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT',
  MAINTENANCE = 'MAINTENANCE',
  PENALTY = 'PENALTY',
}

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Tenant', index: true }) tenantId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) landlordId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' }) propertyId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' }) organizationId: Types.ObjectId;
  @Prop({ type: String, enum: PaymentType, default: PaymentType.RENT }) type: PaymentType;
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Prop({ required: true }) amount: number;
  @Prop({ required: true }) dueDate: Date;
  @Prop({ required: true, min: 1, max: 12 }) month: number;
  @Prop({ required: true }) year: number;
  @Prop({ default: 0 }) latePenalty: number;
  @Prop({ type: Object, default: null }) submission: {
    screenshotPath: string;
    utrNumber: string;
    paymentMethod: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';
    paymentApp?: string;
    paidAmount: number;
    note?: string;
    submittedAt: Date;
    ipAddress?: string;
  } | null;
  @Prop({ type: Object, default: null }) verification: {
    verifiedBy: Types.ObjectId;
    verifiedAt: Date;
    action: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    disputeNote?: string;
  } | null;
  @Prop({ type: Object, default: null }) receipt: {
    receiptId: string;
    pdfPath: string;
    generatedAt: Date;
    verificationHash: string;
    downloadUrl: string;
  } | null;
  @Prop({ type: Object, default: null }) gateway: {
    provider?: 'RAZORPAY' | 'CASHFREE' | 'MANUAL';
    orderId?: string;
    transactionId?: string;
  } | null;
  @Prop() paidAt?: Date;
  @Prop({ default: '' }) notes: string;
  @Prop({ default: false }) isDeleted: boolean;
  @Prop() deletedAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
// Idempotency guard: at most one active payment per tenant/month/year/type.
// Prevents duplicate rent from concurrent cron runs, retries, or manual re-creation.
PaymentSchema.index(
  { tenantId: 1, year: 1, month: 1, type: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
PaymentSchema.index({ tenantId: 1, status: 1, year: 1, month: 1 });
PaymentSchema.index({ landlordId: 1, status: 1, year: 1, month: 1 });
PaymentSchema.index({ organizationId: 1, year: 1, month: 1 });
PaymentSchema.index({ dueDate: 1, status: 1 });
PaymentSchema.index({ 'submission.utrNumber': 1 }, { sparse: true });
PaymentSchema.index({ 'receipt.receiptId': 1 }, { sparse: true });
