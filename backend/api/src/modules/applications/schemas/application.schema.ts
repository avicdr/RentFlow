import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RentalApplicationDocument = RentalApplication & Document;

export const APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
] as const;

export const EMPLOYMENT_TYPES = [
  'SALARIED',
  'SELF_EMPLOYED',
  'STUDENT',
  'BUSINESS_OWNER',
  'OTHER',
] as const;

@Schema({ timestamps: true, collection: 'rental_applications' })
export class RentalApplication {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Tenant', default: null })
  tenantId?: Types.ObjectId | null;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  landlordId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true })
  propertyId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Room', index: true })
  roomId: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    enum: APPLICATION_STATUSES,
    default: 'SUBMITTED',
    index: true,
  })
  status: string;

  @Prop({ required: true, type: Date })
  preferredMoveInDate: Date;

  // Applicant Profile Snapshot
  @Prop({ type: Object, required: true })
  applicantProfile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    currentCity?: string;
    occupation?: string;
    bio?: string;
  };

  // Employment Details
  @Prop({ type: Object, default: {} })
  employmentInfo: {
    type: 'SALARIED' | 'SELF_EMPLOYED' | 'STUDENT' | 'BUSINESS_OWNER' | 'OTHER';
    organization?: string;
    designation?: string;
    monthlyIncome?: number;
    durationMonths?: number;
    workAddress?: string;
  };

  // Income Verification
  @Prop({ type: Object, default: {} })
  incomeInfo?: {
    monthlyIncome?: number;
    incomeSource?: string;
    proofDocumentUrl?: string;
    proofDocumentName?: string;
    documentId?: Types.ObjectId;
  };

  // KYC Verification snapshot
  @Prop({
    type: String,
    enum: ['VERIFIED', 'PENDING', 'NOT_VERIFIED', 'REJECTED'],
    default: 'PENDING',
  })
  kycStatus: string;

  // RentPass Snapshot
  @Prop({ type: String, default: null })
  rentPassShareToken?: string | null;

  @Prop({ type: Object, default: null })
  rentPassSnapshot?: {
    score?: number;
    grade?: string;
    onTimePaymentsCount?: number;
    totalPaymentsCount?: number;
    tenancyHistoryMonths?: number;
    sharedAt?: Date;
  } | null;

  // Rental References
  @Prop({ type: [Object], default: [] })
  references?: Array<{
    name: string;
    relation: string;
    phone: string;
    email?: string;
    durationMonths?: number;
    propertyAddress?: string;
    status?: 'PENDING' | 'VERIFIED' | 'UNREACHABLE';
  }>;

  @Prop({ default: '' })
  additionalNotes?: string;

  @Prop({ default: '' })
  rejectionReason?: string;

  @Prop({ default: '' })
  landlordNotes?: string;

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const RentalApplicationSchema = SchemaFactory.createForClass(RentalApplication);
RentalApplicationSchema.index({ userId: 1, status: 1 });
RentalApplicationSchema.index({ landlordId: 1, status: 1 });
RentalApplicationSchema.index({ propertyId: 1, status: 1 });
RentalApplicationSchema.index({ roomId: 1, status: 1 });
