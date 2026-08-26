import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  LANDLORD = 'LANDLORD',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  TENANT = 'TENANT',
  BROKER = 'BROKER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true }) firstName: string;
  @Prop({ required: true, trim: true }) lastName: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ required: true, select: false }) passwordHash: string;
  @Prop({ sparse: true, unique: true }) phone: string;
  @Prop({ type: String, enum: UserRole, required: true }) role: UserRole;
  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING_VERIFICATION }) status: UserStatus;
  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true }) organizationId: Types.ObjectId;
  @Prop({ default: false }) isEmailVerified: boolean;
  @Prop({ default: false }) isPhoneVerified: boolean;
  @Prop({
    type: {
      avatar: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      dateOfBirth: Date,
      gender: String,
    },
    default: {},
  })
  profile: {
    avatar?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    dateOfBirth?: Date;
    gender?: string;
  };
  @Prop({
    type: {
      maskedNumber: String,
      encryptedHash: String,
      verificationMethod: String,
      verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
      verifiedAt: Date,
    },
    select: false,
    default: null,
  })
  aadhaarData: {
    maskedNumber: string;
    encryptedHash: string;
    verificationMethod: 'DIGILOCKER' | 'MANUAL';
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedAt?: Date;
  } | null;
  @Prop({ type: String, enum: ['NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'], default: 'NOT_VERIFIED' })
  verificationStatus: string;
  @Prop({ default: false })
  isLandlordVerified: boolean;
  @Prop({
    type: {
      status: { type: String, enum: ['NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'], default: 'NOT_VERIFIED' },
      verifiedAt: Date,
      notes: String,
      documents: [String],
    },
    default: null,
  })
  landlordVerification?: {
    status: string;
    verifiedAt?: Date;
    notes?: string;
    documents?: string[];
  } | null;
  @Prop() lastLoginAt?: Date;
  @Prop({ default: false }) isDeleted: boolean;
  @Prop() deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ isDeleted: 1, createdAt: -1 });

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
