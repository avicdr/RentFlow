# RentFlow — Part 3: Backend Auth, RBAC & Payment System

## 1. AUTH SERVICE

```typescript
// backend/api/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Session') private sessionModel: Model<any>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string, meta: { ip: string; ua: string; device: string }) {
    const user = await this.userModel.findOne({ email, isDeleted: false }).select('+passwordHash');
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!await argon2.verify(user.passwordHash, password))
      throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.signAccess(user);
    const { raw, hash } = this.makeRefreshToken();
    await this.sessionModel.create({
      userId: user._id, tokenHash: hash,
      expiresAt: new Date(Date.now() + 7 * 86400_000),
      deviceInfo: meta.device, ipAddress: meta.ip, userAgent: meta.ua,
      lastUsedAt: new Date(),
    });
    await this.userModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
    return { accessToken, refreshToken: raw, user: this.sanitize(user) };
  }

  async refresh(rawToken: string) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await this.sessionModel.findOne({
      tokenHash: hash, isRevoked: false, expiresAt: { $gt: new Date() },
    });
    if (!session) throw new UnauthorizedException('Session expired');
    const user = await this.userModel.findById(session.userId);
    if (!user || user.isDeleted) throw new UnauthorizedException();
    const { raw, hash: newHash } = this.makeRefreshToken();
    await this.sessionModel.updateOne({ _id: session._id }, { tokenHash: newHash, lastUsedAt: new Date() });
    return { accessToken: this.signAccess(user), refreshToken: raw };
  }

  async logout(userId: string, rawToken: string) {
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await this.sessionModel.updateOne(
      { userId, tokenHash: hash },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'LOGOUT' }
    );
  }

  async logoutAll(userId: string) {
    await this.sessionModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'LOGOUT_ALL' }
    );
  }

  private signAccess(user: any) {
    return this.jwtService.sign({
      sub: user._id.toString(), email: user.email,
      role: user.role, orgId: user.organizationId?.toString(),
    });
  }

  private makeRefreshToken() {
    const raw = crypto.randomBytes(64).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    return { raw, hash };
  }

  private sanitize(user: any) {
    const { passwordHash, aadhaarData, ...safe } = user.toObject();
    return safe;
  }
}
```

## 2. JWT STRATEGY

```typescript
// modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (!payload.sub) throw new UnauthorizedException();
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      orgId: payload.orgId,
    };
  }
}
```

## 3. RBAC GUARDS

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [ctx.getHandler(), ctx.getClass()]);
    if (!roles) return true;
    const { user } = ctx.switchToHttp().getRequest();
    if (!roles.includes(user.role)) throw new ForbiddenException('Insufficient role');
    return true;
  }
}

// common/guards/tenant-ownership.guard.ts
// Ensures LANDLORD can only access their own org's resources
@Injectable()
export class TenantOwnershipGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (user.role === 'SUPER_ADMIN') return true;
    const resourceOrgId = req.params.orgId ?? req.body?.organizationId;
    if (resourceOrgId && resourceOrgId !== user.orgId)
      throw new ForbiddenException('Cross-tenant access denied');
    return true;
  }
}

// Usage:
// @Roles('LANDLORD', 'PROPERTY_MANAGER')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Get('properties')
```

## 4. MULTI-TENANT MIDDLEWARE

```typescript
// common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    if (req.user) {
      req.tenantId = req.user.orgId;
      // All DB queries MUST include { organizationId: req.tenantId }
      // This is enforced via repository layer — not optional
    }
    next();
  }
}
```

## 5. MANUAL PAYMENT VERIFICATION SERVICE

```typescript
// modules/payments/payments.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { PaymentStatus } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Notification') private notificationModel: Model<any>,
    @InjectModel('AuditLog') private auditModel: Model<any>,
    private receiptService: ReceiptService,
  ) {}

  // Tenant submits payment proof
  async submitPayment(paymentId: string, tenantUserId: string, dto: SubmitPaymentDto) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PENDING)
      throw new BadRequestException(`Cannot submit — current status: ${payment.status}`);

    // Duplicate UTR check
    const duplicate = await this.paymentModel.findOne({
      'submission.utrNumber': dto.utrNumber,
      _id: { $ne: payment._id },
    });
    if (duplicate) throw new BadRequestException('Duplicate UTR number — already submitted');

    await this.paymentModel.updateOne({ _id: paymentId }, {
      status: PaymentStatus.PAYMENT_SUBMITTED,
      submission: {
        screenshotPath: dto.screenshotPath,
        utrNumber: dto.utrNumber.trim().toUpperCase(),
        paymentMethod: dto.paymentMethod,
        paymentApp: dto.paymentApp,
        paidAmount: dto.paidAmount,
        note: dto.note,
        submittedAt: new Date(),
        ipAddress: dto.ipAddress,
      },
    });

    // Notify landlord
    await this.notificationModel.create({
      userId: payment.landlordId,
      type: 'PAYMENT_SUBMITTED',
      title: 'Payment Proof Submitted',
      body: `Tenant submitted payment proof for ${payment.month}/${payment.year}. Please verify.`,
      data: { paymentId: paymentId.toString() },
    });

    await this.audit(payment.landlordId, 'PAYMENT_SUBMITTED', 'Payment', payment._id, { status: 'PENDING' }, { status: 'PAYMENT_SUBMITTED' });
    return { message: 'Payment submitted for review' };
  }

  // Landlord approves payment
  async approvePayment(paymentId: string, landlordUserId: string, note?: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('tenantId')
      .populate('propertyId');
    if (!payment) throw new NotFoundException();
    if (!['PAYMENT_SUBMITTED', 'UNDER_REVIEW'].includes(payment.status))
      throw new BadRequestException('Payment is not pending review');

    // Generate receipt
    const receipt = await this.receiptService.generate(payment);

    await this.paymentModel.updateOne({ _id: paymentId }, {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      verification: {
        verifiedBy: new Types.ObjectId(landlordUserId),
        verifiedAt: new Date(),
        action: 'APPROVED',
        disputeNote: note,
      },
      receipt,
    });

    // Notify tenant
    await this.notificationModel.create({
      userId: payment.tenantId.userId,
      type: 'PAYMENT_VERIFIED',
      title: 'Payment Verified ✅',
      body: `Your rent for ${payment.month}/${payment.year} has been verified. Receipt: ${receipt.receiptId}`,
      data: { paymentId: paymentId.toString(), receiptId: receipt.receiptId },
    });

    await this.audit(landlordUserId, 'PAYMENT_APPROVED', 'Payment', payment._id, {}, { status: 'PAID', receipt: receipt.receiptId });
    return { message: 'Payment approved', receiptId: receipt.receiptId };
  }

  // Landlord rejects payment
  async rejectPayment(paymentId: string, landlordUserId: string, reason: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new NotFoundException();

    await this.paymentModel.updateOne({ _id: paymentId }, {
      status: PaymentStatus.REJECTED,
      verification: {
        verifiedBy: new Types.ObjectId(landlordUserId),
        verifiedAt: new Date(),
        action: 'REJECTED',
        rejectionReason: reason,
      },
    });

    await this.notificationModel.create({
      userId: payment.tenantId,
      type: 'PAYMENT_REJECTED',
      title: 'Payment Rejected ❌',
      body: `Your payment submission was rejected: ${reason}. Please resubmit.`,
      data: { paymentId: paymentId.toString() },
    });

    await this.audit(landlordUserId, 'PAYMENT_REJECTED', 'Payment', payment._id, {}, { status: 'REJECTED', reason });
  }

  private async audit(by: any, action: string, resource: string, resourceId: any, before: any, after: any) {
    await this.auditModel.create({ performedBy: by, action, resource, resourceId, before, after, severity: 'INFO' });
  }
}
```

## 6. RECEIPT GENERATION SERVICE

```typescript
// modules/payments/receipt.service.ts
import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class ReceiptService {
  async generate(payment: any) {
    const receiptId = `RF-${payment.year}-${String(payment.month).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;
    const fileName = `${receiptId}.pdf`;
    const filePath = path.join(process.env.RECEIPT_STORAGE_DIR, fileName);

    const tenant = payment.tenantId;
    const property = payment.propertyId;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('RentFlow', 50, 50);
    doc.fontSize(10).font('Helvetica').text('Official Rent Receipt', 50, 80);
    doc.moveTo(50, 100).lineTo(545, 100).stroke();

    // Receipt Info
    doc.fontSize(12).font('Helvetica-Bold').text(`Receipt ID: ${receiptId}`, 50, 120);
    doc.font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 50, 140);

    // Tenant Details
    doc.font('Helvetica-Bold').text('Tenant', 50, 180);
    doc.font('Helvetica')
      .text(`Name: ${tenant.firstName} ${tenant.lastName}`, 50, 200)
      .text(`Phone: ${tenant.phone}`, 50, 218);

    // Property Details
    doc.font('Helvetica-Bold').text('Property', 300, 180);
    doc.font('Helvetica')
      .text(`${property.name}`, 300, 200)
      .text(`${property.address.city}, ${property.address.state}`, 300, 218);

    // Payment Details
    doc.moveTo(50, 260).lineTo(545, 260).stroke();
    doc.font('Helvetica-Bold').fontSize(14).text('Payment Details', 50, 280);
    doc.font('Helvetica').fontSize(12)
      .text(`Rent Month: ${payment.month}/${payment.year}`, 50, 310)
      .text(`Amount: ₹${payment.amount.toLocaleString('en-IN')}`, 50, 330)
      .text(`Payment Method: ${payment.submission.paymentMethod}`, 50, 350)
      .text(`UTR/Reference: ${payment.submission.utrNumber}`, 50, 370)
      .text(`Paid On: ${payment.submission.submittedAt.toLocaleDateString('en-IN')}`, 50, 390)
      .text(`Verified On: ${new Date().toLocaleDateString('en-IN')}`, 50, 410);

    // Verification hash
    const hashContent = `${receiptId}|${payment._id}|${payment.amount}|${payment.submission.utrNumber}`;
    const verificationHash = crypto.createHmac('sha256', process.env.FIELD_ENCRYPTION_KEY)
      .update(hashContent).digest('hex').substring(0, 16).toUpperCase();

    doc.moveTo(50, 450).lineTo(545, 450).stroke();
    doc.fontSize(9).font('Helvetica').fillColor('#888888')
      .text(`Verification Hash: ${verificationHash}`, 50, 465)
      .text('This is a computer-generated receipt and does not require a physical signature.', 50, 480);

    doc.end();

    await new Promise<void>((resolve) => stream.on('finish', resolve));

    return {
      receiptId,
      pdfPath: filePath,
      generatedAt: new Date(),
      verificationHash,
      downloadUrl: `${process.env.RECEIPT_BASE_URL}/${fileName}`,
    };
  }
}
```

## 7. API ROUTES

```
# AUTH
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-otp

# USERS
GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users            [ADMIN]
GET    /api/v1/users/:id        [ADMIN]
PATCH  /api/v1/users/:id/status [ADMIN]

# PROPERTIES
POST   /api/v1/properties
GET    /api/v1/properties
GET    /api/v1/properties/:id
PATCH  /api/v1/properties/:id
DELETE /api/v1/properties/:id
PATCH  /api/v1/properties/:id/payment-methods
GET    /api/v1/properties/:id/rooms
GET    /api/v1/properties/:id/tenants

# PAYMENTS (Manual Verification)
GET    /api/v1/payments                         [landlord: all, tenant: own]
POST   /api/v1/payments                         [landlord: create rent due]
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/submit              [tenant: upload proof + UTR]
PATCH  /api/v1/payments/:id/approve             [landlord only]
PATCH  /api/v1/payments/:id/reject              [landlord only]
PATCH  /api/v1/payments/:id/set-under-review    [landlord only]
GET    /api/v1/payments/:id/receipt             [download PDF]
GET    /api/v1/payments/pending-review          [landlord action queue]

# COMPLAINTS
POST   /api/v1/complaints
GET    /api/v1/complaints
GET    /api/v1/complaints/:id
PATCH  /api/v1/complaints/:id/assign
PATCH  /api/v1/complaints/:id/resolve

# DOCUMENTS
POST   /api/v1/documents/upload
GET    /api/v1/documents/:id
DELETE /api/v1/documents/:id

# DIGILOCKER
GET    /api/v1/digilocker/init
GET    /api/v1/digilocker/callback
GET    /api/v1/digilocker/status
POST   /api/v1/digilocker/manual-aadhaar

# LISTINGS (Public marketplace)
GET    /api/v1/listings         [public] ?city=&type=&minRent=&maxRent=
GET    /api/v1/listings/:id     [public]
POST   /api/v1/listings         [landlord]
PATCH  /api/v1/listings/:id     [landlord]
DELETE /api/v1/listings/:id     [landlord]

# VISITS
POST   /api/v1/visits
GET    /api/v1/visits
PATCH  /api/v1/visits/:id/confirm
PATCH  /api/v1/visits/:id/cancel

# NOTIFICATIONS
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/mark-all-read

# AUDIT LOGS
GET    /api/v1/audit-logs  [ADMIN+LANDLORD]
```

## 8. STANDARD API RESPONSE

```typescript
// Every API response follows this envelope:
{
  "success": true,
  "statusCode": 200,
  "message": "Payment approved",
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 },
  "timestamp": "2025-01-01T10:00:00.000Z"
}

// Errors:
{
  "success": false,
  "statusCode": 422,
  "error": "UNPROCESSABLE_ENTITY",
  "message": "Duplicate UTR number",
  "details": [{ "field": "utrNumber", "message": "Already exists" }],
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```
