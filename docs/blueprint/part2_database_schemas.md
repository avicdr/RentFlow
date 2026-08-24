# RentFlow — Blueprint Part 2: MongoDB Schema Design

---

## DESIGN PRINCIPLES

- **Multi-tenant isolation**: `organizationId` on every tenant-scoped collection
- **Soft deletes**: `isDeleted + deletedAt` — never hard delete
- **Encryption**: Aadhaar/PAN encrypted via pre-save hooks (AES-256-GCM)
- **Audit-ready**: `createdBy + updatedBy` on all mutable documents
- **Pagination**: cursor-based via `_id` + `createdAt` for large collections

---

## 1. USERS SCHEMA

```typescript
// backend/api/src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
  @Prop({ required: true, unique: true, lowercase: true }) email: string;
  @Prop({ required: true, select: false }) passwordHash: string;
  @Prop({ unique: true, sparse: true }) phone: string;
  @Prop({ enum: UserRole, required: true }) role: UserRole;
  @Prop({ enum: UserStatus, default: UserStatus.PENDING_VERIFICATION }) status: UserStatus;
  @Prop({ type: Types.ObjectId, ref: 'Organization', index: true }) organizationId?: Types.ObjectId;
  @Prop({ default: false }) isEmailVerified: boolean;
  @Prop({ default: false }) isPhoneVerified: boolean;
  @Prop({ type: Object }) profile: {
    avatar?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    dateOfBirth?: Date;
  };
  @Prop({ type: Object, select: false }) aadhaarData?: {
    maskedNumber: string;        // XXXX-XXXX-1234
    encryptedHash: string;       // SHA-256 of full number
    verificationMethod: 'DIGILOCKER' | 'MANUAL';
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedAt?: Date;
  };
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
```

---

## 2. PROPERTIES SCHEMA

```typescript
@Schema({ timestamps: true, collection: 'properties' })
export class Property {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) landlordId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization', index: true }) organizationId: Types.ObjectId;
  @Prop({ required: true }) name: string;
  @Prop() description: string;
  @Prop({ enum: ['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL'] }) type: string;
  @Prop({ enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DRAFT'], default: 'DRAFT' }) status: string;
  @Prop({ required: true, type: Object }) address: {
    line1: string; line2?: string; city: string;
    state: string; pincode: string; country: string;
  };
  @Prop({ type: Object }) location?: {
    type: 'Point'; coordinates: [number, number];
  };
  @Prop({ type: Object }) amenities: Record<string, boolean>;
  @Prop({ type: [String], default: [] }) images: string[];
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) managedBy: Types.ObjectId[];
  @Prop({ type: Types.ObjectId, ref: 'User' }) assignedBroker?: Types.ObjectId;
  @Prop({ default: 0 }) totalRooms: number;
  @Prop({ default: 0 }) totalBeds: number;
  @Prop({ default: 0 }) occupiedBeds: number;
  @Prop({ default: false }) isListed: boolean;
  @Prop({ default: false }) isDeleted: boolean;
  @Prop() deletedAt?: Date;
  @Prop({ type: Object }) paymentMethods?: {
    upiId?: string;
    qrCodePath?: string;
    bankAccount?: { bankName: string; accountNumber: string; ifsc: string; accountHolder: string };
    paymentPhone?: string;
    instructions?: string;
  };
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ landlordId: 1, status: 1 });
PropertySchema.index({ organizationId: 1, isDeleted: 1 });
PropertySchema.index({ 'address.city': 1, type: 1, status: 1 });
PropertySchema.index({ isListed: 1, status: 1 });
PropertySchema.index({ location: '2dsphere' }, { sparse: true });
```

---

## 3. ROOMS & BEDS

```typescript
@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true }) propertyId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) landlordId: Types.ObjectId;
  @Prop({ required: true }) roomNumber: string;
  @Prop({ enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY', 'STUDIO'] }) type: string;
  @Prop({ required: true, min: 1 }) capacity: number;
  @Prop({ default: 0 }) occupiedCount: number;
  @Prop({ required: true }) monthlyRent: number;
  @Prop({ required: true }) securityDeposit: number;
  @Prop({ enum: ['AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULLY_OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' }) status: string;
  @Prop({ type: [String] }) images: string[];
  @Prop({ default: false }) isDeleted: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ propertyId: 1, status: 1 });
RoomSchema.index({ propertyId: 1, roomNumber: 1 }, { unique: true });

@Schema({ timestamps: true, collection: 'beds' })
export class Bed {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Room', index: true }) roomId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true }) propertyId: Types.ObjectId;
  @Prop({ required: true }) bedNumber: string;
  @Prop({ enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'], default: 'AVAILABLE' }) status: string;
  @Prop({ type: Types.ObjectId, ref: 'Tenant' }) currentTenantId?: Types.ObjectId;
  @Prop() occupiedSince?: Date;
  @Prop() expectedVacatingDate?: Date;
}

export const BedSchema = SchemaFactory.createForClass(Bed);
BedSchema.index({ roomId: 1, status: 1 });
BedSchema.index({ propertyId: 1, status: 1 });
```

---

## 4. TENANTS SCHEMA

```typescript
@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true }) userId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) landlordId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' }) organizationId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' }) propertyId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Room' }) roomId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Bed' }) bedId?: Types.ObjectId;
  @Prop({ required: true }) joiningDate: Date;
  @Prop() vacatingDate?: Date;
  @Prop({ enum: ['ACTIVE', 'NOTICE_PERIOD', 'VACATED', 'BLACKLISTED'], default: 'ACTIVE' }) status: string;
  @Prop({ required: true }) agreedRent: number;
  @Prop({ required: true }) securityDeposit: number;
  @Prop({ required: true, min: 1, max: 31 }) rentDueDay: number;
  @Prop({ type: Types.ObjectId, ref: 'Document' }) agreementDocumentId?: Types.ObjectId;
  @Prop({ type: Object }) emergencyContact: { name: string; phone: string; relation: string };
  @Prop({ type: Object }) verificationStatus: {
    aadhaar: 'PENDING' | 'VERIFIED' | 'REJECTED';
    police: 'PENDING' | 'VERIFIED' | 'NOT_REQUIRED';
  };
  @Prop({ type: Types.ObjectId, ref: 'Broker' }) referredBy?: Types.ObjectId;
  @Prop({ default: false }) isDeleted: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ landlordId: 1, status: 1 });
TenantSchema.index({ propertyId: 1, status: 1 });
TenantSchema.index({ userId: 1 }, { unique: true });
TenantSchema.index({ rentDueDay: 1, status: 1 }); // Rent reminder cron
```

---

## 5. PAYMENTS SCHEMA (Manual Verification System)

```typescript
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
  @Prop({ enum: PaymentType, default: PaymentType.RENT }) type: PaymentType;
  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Prop({ required: true }) amount: number;
  @Prop({ required: true }) dueDate: Date;
  @Prop({ required: true }) month: number;   // 1–12
  @Prop({ required: true }) year: number;
  @Prop({ default: 0 }) latePenalty: number;

  // ── Tenant Submission ──────────────────────────────────
  @Prop({ type: Object }) submission?: {
    screenshotPath: string;          // Uploaded payment screenshot
    utrNumber: string;               // UTR / Reference number
    paymentMethod: 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';
    paymentApp?: string;             // e.g. 'GPAY', 'PHONEPE', 'PAYTM'
    paidAmount: number;
    note?: string;
    submittedAt: Date;
    ipAddress?: string;
  };

  // ── Landlord Verification ─────────────────────────────
  @Prop({ type: Object }) verification?: {
    verifiedBy: Types.ObjectId;
    verifiedAt: Date;
    action: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    disputeNote?: string;
  };

  // ── Receipt ───────────────────────────────────────────
  @Prop({ type: Object }) receipt?: {
    receiptId: string;               // RF-2025-001234
    pdfPath: string;                 // Stored PDF path
    generatedAt: Date;
    verificationHash: string;        // HMAC of receipt contents
    downloadUrl?: string;
  };

  // ── Gateway-Ready Fields (future Razorpay/Cashfree) ──
  @Prop({ type: Object }) gateway?: {
    provider?: 'RAZORPAY' | 'CASHFREE' | 'MANUAL';
    orderId?: string;
    transactionId?: string;
    signature?: string;
  };

  @Prop() paidAt?: Date;
  @Prop() notes?: string;
  @Prop({ default: false }) isDeleted: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ tenantId: 1, status: 1, year: 1, month: 1 });
PaymentSchema.index({ landlordId: 1, status: 1, year: 1, month: 1 });
PaymentSchema.index({ organizationId: 1, year: 1, month: 1 });
PaymentSchema.index({ dueDate: 1, status: 1 });              // Overdue detection cron
PaymentSchema.index({ 'submission.utrNumber': 1 }, { sparse: true }); // Duplicate UTR detection
PaymentSchema.index({ 'receipt.receiptId': 1 }, { sparse: true });
```

---

## 6. COMPLAINTS SCHEMA

```typescript
@Schema({ timestamps: true, collection: 'complaints' })
export class Complaint {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) raisedBy: Types.ObjectId;
  @Prop({ enum: ['TENANT', 'LANDLORD'] }) raisedByRole: string;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true }) propertyId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) landlordId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'Organization' }) organizationId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) description: string;
  @Prop({ enum: ['MAINTENANCE', 'NOISE', 'BILLING', 'SAFETY', 'HARASSMENT', 'OTHER'] }) category: string;
  @Prop({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' }) priority: string;
  @Prop({ enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'], default: 'OPEN' }) status: string;
  @Prop({ type: [String], default: [] }) attachments: string[];
  @Prop({ type: Types.ObjectId, ref: 'User' }) assignedTo?: Types.ObjectId;
  @Prop() resolvedAt?: Date;
  @Prop() resolutionNote?: string;
  @Prop({ type: [Object], default: [] }) timeline: Array<{
    action: string; performedBy: Types.ObjectId; note?: string; timestamp: Date;
  }>;
  @Prop({ default: false }) isDeleted: boolean;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);
ComplaintSchema.index({ landlordId: 1, status: 1, createdAt: -1 });
ComplaintSchema.index({ raisedBy: 1, status: 1 });
ComplaintSchema.index({ propertyId: 1, status: 1 });
```

---

## 7. SESSIONS SCHEMA (Refresh Token Management)

```typescript
@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) userId: Types.ObjectId;
  @Prop({ required: true, unique: true, select: false }) tokenHash: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop() deviceInfo: string;
  @Prop() ipAddress: string;
  @Prop() userAgent: string;
  @Prop({ default: false }) isRevoked: boolean;
  @Prop() revokedAt?: Date;
  @Prop() revokedReason?: string;
  @Prop() lastUsedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ userId: 1, isRevoked: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-TTL cleanup
SessionSchema.index({ tokenHash: 1 }, { unique: true });
```

---

## 8. AUDIT LOGS SCHEMA

```typescript
@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) performedBy: Types.ObjectId;
  @Prop({ required: true }) action: string;       // 'PAYMENT_APPROVED', 'TENANT_CREATED'
  @Prop({ required: true }) resource: string;     // 'Payment', 'Tenant'
  @Prop({ type: Types.ObjectId }) resourceId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId }) organizationId?: Types.ObjectId;
  @Prop({ type: Object }) before?: Record<string, unknown>;
  @Prop({ type: Object }) after?: Record<string, unknown>;
  @Prop({ type: Object }) metadata: { ipAddress?: string; userAgent?: string };
  @Prop({ enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' }) severity: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });
```

---

## 9. ADDITIONAL SCHEMAS (Summary)

```typescript
// Notifications
@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true }) userId: Types.ObjectId;
  @Prop({ enum: ['PAYMENT_DUE', 'PAYMENT_VERIFIED', 'PAYMENT_REJECTED', 'COMPLAINT_UPDATE',
                  'VISIT_CONFIRMED', 'AGREEMENT_EXPIRY', 'GENERAL'] }) type: string;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) body: string;
  @Prop({ type: Object }) data?: Record<string, string>;
  @Prop({ default: false }) isRead: boolean;
  @Prop({ default: false }) isDeleted: boolean;
}
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90-day TTL

// Documents
@Schema({ timestamps: true, collection: 'documents' })
export class Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) uploadedBy: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Organization' }) organizationId?: Types.ObjectId;
  @Prop({ required: true }) filePath: string;
  @Prop({ required: true }) originalName: string;
  @Prop({ required: true }) mimeType: string;
  @Prop({ required: true }) sizeBytes: number;
  @Prop({ enum: ['AGREEMENT', 'AADHAAR', 'PAN', 'POLICE_NOC', 'PAYMENT_SCREENSHOT', 'RECEIPT', 'OTHER'] }) category: string;
  @Prop({ type: Types.ObjectId }) relatedTo?: Types.ObjectId;  // polymorphic ref
  @Prop() relatedModel?: string;
  @Prop({ enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'], default: 'PENDING_REVIEW' }) status: string;
  @Prop({ default: false }) isDeleted: boolean;
}
DocumentSchema.index({ uploadedBy: 1, category: 1 });
DocumentSchema.index({ organizationId: 1, category: 1 });

// Listings (marketplace)
@Schema({ timestamps: true, collection: 'listings' })
export class Listing {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' }) propertyId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) landlordId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) description: string;
  @Prop({ required: true }) rentPerMonth: number;
  @Prop({ required: true }) securityDeposit: number;
  @Prop({ enum: ['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL'] }) propertyType: string;
  @Prop({ type: Object }) address: { city: string; state: string; pincode: string };
  @Prop({ type: [String] }) images: string[];
  @Prop({ type: Object }) amenities: Record<string, boolean>;
  @Prop({ enum: ['ACTIVE', 'PAUSED', 'FILLED', 'REMOVED'], default: 'ACTIVE' }) status: string;
  @Prop({ default: 0 }) viewCount: number;
  @Prop({ default: false }) isDeleted: boolean;
}
ListingSchema.index({ 'address.city': 1, propertyType: 1, status: 1 });
ListingSchema.index({ landlordId: 1, status: 1 });

// Visits
@Schema({ timestamps: true, collection: 'visits' })
export class Visit {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Listing' }) listingId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) requestedBy: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) landlordId: Types.ObjectId;
  @Prop({ required: true }) scheduledDate: Date;
  @Prop({ required: true }) scheduledTime: string;
  @Prop({ enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'], default: 'PENDING' }) status: string;
  @Prop() cancellationReason?: string;
  @Prop() notes?: string;
}
VisitSchema.index({ landlordId: 1, status: 1, scheduledDate: 1 });
VisitSchema.index({ requestedBy: 1 });

// Brokers
@Schema({ timestamps: true, collection: 'brokers' })
export class Broker {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true }) userId: Types.ObjectId;
  @Prop() agencyName?: string;
  @Prop() licenseNumber?: string;
  @Prop({ enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'], default: 'PENDING' }) verificationStatus: string;
  @Prop({ type: [Types.ObjectId], ref: 'Property' }) assignedProperties: Types.ObjectId[];
  @Prop({ type: Object }) commissionStructure: { type: 'FLAT' | 'PERCENTAGE'; value: number };
  @Prop({ default: 0 }) totalLeads: number;
  @Prop({ default: 0 }) successfulDeals: number;
}

// Leads
@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Listing' }) listingId: Types.ObjectId;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) landlordId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Broker' }) brokerId?: Types.ObjectId;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) phone: string;
  @Prop() email?: string;
  @Prop({ enum: ['NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'DEAL_CLOSED', 'LOST'], default: 'NEW' }) status: string;
  @Prop() notes?: string;
}
```

---

## 10. KEY AGGREGATION PIPELINES

```typescript
// Revenue analytics for landlord dashboard
const revenueByMonth = [
  { $match: { landlordId: new Types.ObjectId(id), isDeleted: false } },
  { $group: {
    _id: { month: '$month', year: '$year' },
    totalDue: { $sum: '$amount' },
    totalCollected: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$amount', 0] } },
    paidCount: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
    pendingCount: { $sum: { $cond: [{ $in: ['$status', ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW']] }, 1, 0] } },
  }},
  { $sort: { '_id.year': -1, '_id.month': -1 } },
  { $limit: 12 },
];

// Occupancy per property
const occupancyPipeline = [
  { $match: { landlordId: new Types.ObjectId(id) } },
  { $lookup: { from: 'beds', localField: '_id', foreignField: 'propertyId', as: 'beds' } },
  { $project: {
    name: 1, address: 1, type: 1,
    totalBeds: { $size: '$beds' },
    occupiedBeds: { $size: { $filter: { input: '$beds', as: 'b', cond: { $eq: ['$$b.status', 'OCCUPIED'] } } } },
    occupancyRate: {
      $cond: [
        { $gt: [{ $size: '$beds' }, 0] },
        { $multiply: [{ $divide: [
          { $size: { $filter: { input: '$beds', as: 'b', cond: { $eq: ['$$b.status', 'OCCUPIED'] } } } },
          { $size: '$beds' }
        ]}, 100] },
        0
      ]
    }
  }},
];

// Pending payment reviews (landlord action queue)
const pendingReviews = [
  { $match: { landlordId: new Types.ObjectId(id), status: 'PAYMENT_SUBMITTED', isDeleted: false } },
  { $lookup: { from: 'tenants', localField: 'tenantId', foreignField: '_id', as: 'tenant' } },
  { $lookup: { from: 'users', localField: 'tenant.userId', foreignField: '_id', as: 'tenantUser' } },
  { $unwind: '$tenant' },
  { $unwind: '$tenantUser' },
  { $project: {
    amount: 1, month: 1, year: 1, dueDate: 1,
    submission: 1,
    tenantName: { $concat: ['$tenantUser.firstName', ' ', '$tenantUser.lastName'] },
    tenantPhone: '$tenantUser.phone',
  }},
  { $sort: { 'submission.submittedAt': 1 } },
];
```
