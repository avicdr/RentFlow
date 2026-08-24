import {
  Injectable, UnauthorizedException, BadRequestException,
  ConflictException, NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument, UserRole, UserStatus } from '../users/schemas/user.schema';
import { Session, SessionDocument } from './schemas/session.schema';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto } from './dto/auth.dto';
import { MailService } from '../notifications/mail.service';
import { LoginThrottleService } from './login-throttle.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
    private loginThrottle: LoginThrottleService,
  ) {}

  // ── Register ────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (exists) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.userModel.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      passwordHash,
      phone: dto.phone,
      role: dto.role,
      status: UserStatus.PENDING_VERIFICATION,
    });

    // Send verification OTP
    await this.sendOtp(user.email, 'EMAIL_VERIFICATION');

    return {
      message: 'Registration successful. Please verify your email.',
      userId: user._id,
    };
  }

  // ── Login ────────────────────────────────────────────────────────────────
  async login(
    dto: LoginDto,
    meta: { ip: string; ua: string; device: string },
  ) {
    // Brute-force lockout by IP+email — throws 429-style error if locked out.
    this.loginThrottle.checkThrottle(meta.ip, dto.email);

    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase(), isDeleted: false })
      .select('+passwordHash');

    if (!user) {
      this.loginThrottle.recordFailure(meta.ip, dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status === UserStatus.SUSPENDED)
      throw new UnauthorizedException('Account suspended. Contact support.');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      this.loginThrottle.recordFailure(meta.ip, dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Successful auth — clear the failure counter for this IP+email.
    this.loginThrottle.recordSuccess(meta.ip, dto.email);

    await this.userModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.createSession(user._id, refreshToken, meta);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  // ── Refresh Tokens ───────────────────────────────────────────────────────
  async refresh(rawToken: string) {
    const hash = this.hashToken(rawToken);
    const session = await this.sessionModel
      .findOne({ tokenHash: hash, isRevoked: false, expiresAt: { $gt: new Date() } })
      .select('+tokenHash');

    if (!session) throw new UnauthorizedException('Invalid or expired session');

    const user = await this.userModel.findById(session.userId);
    if (!user || user.isDeleted || user.status === UserStatus.SUSPENDED)
      throw new UnauthorizedException('User account unavailable');

    const { accessToken, refreshToken: newRawToken } = await this.generateTokens(user);
    const newHash = this.hashToken(newRawToken);

    // Rotate refresh token
    await this.sessionModel.updateOne(
      { _id: session._id },
      { tokenHash: newHash, lastUsedAt: new Date() },
    );

    return { accessToken, refreshToken: newRawToken };
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  async logout(userId: string, rawToken: string) {
    const hash = this.hashToken(rawToken);
    await this.sessionModel.updateOne(
      { userId: new Types.ObjectId(userId), tokenHash: hash },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'LOGOUT' },
    );
    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(userId: string) {
    await this.sessionModel.updateMany(
      { userId: new Types.ObjectId(userId), isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'LOGOUT_ALL' },
    );
    return { message: 'All sessions terminated' };
  }

  // ── Password Reset ───────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If the email exists, a reset code has been sent.' };
    await this.sendOtp(dto.email, 'PASSWORD_RESET');
    return { message: 'If the email exists, a reset code has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.verifyOtp(dto.email, dto.otp, 'PASSWORD_RESET');
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4,
    });

    await this.userModel.updateOne({ _id: user._id }, { passwordHash });
    await this.logoutAllDevices(user._id.toString());
    return { message: 'Password reset successful. Please login again.' };
  }

  // ── OTP Verification ─────────────────────────────────────────────────────
  async sendOtp(email: string, purpose: string) {
    // Invalidate existing OTPs for this email/purpose
    await this.otpModel.updateMany(
      { email: email.toLowerCase(), purpose, isUsed: false },
      { isUsed: true },
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.otpModel.create({ email: email.toLowerCase(), code, purpose, expiresAt });
    await this.mailService.sendOtp(email, code, purpose);

    return { message: 'OTP sent to email' };
  }

  async verifyOtp(email: string, code: string, purpose: string) {
    const otp = await this.otpModel.findOne({
      email: email.toLowerCase(), purpose, isUsed: false, expiresAt: { $gt: new Date() },
    });

    if (!otp) throw new BadRequestException('Invalid or expired OTP');

    if (otp.attempts >= 5) {
      await this.otpModel.updateOne({ _id: otp._id }, { isUsed: true });
      throw new BadRequestException('Too many attempts. Request a new OTP.');
    }

    if (otp.code !== code) {
      await this.otpModel.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
      throw new BadRequestException('Invalid OTP');
    }

    await this.otpModel.updateOne({ _id: otp._id }, { isUsed: true });

    if (purpose === 'EMAIL_VERIFICATION') {
      await this.userModel.updateOne(
        { email: email.toLowerCase() },
        { isEmailVerified: true, status: UserStatus.ACTIVE },
      );
    }

    return { message: 'OTP verified successfully' };
  }

  // ── Sessions ─────────────────────────────────────────────────────────────
  async getSessions(userId: string) {
    return this.sessionModel.find(
      { userId: new Types.ObjectId(userId), isRevoked: false, expiresAt: { $gt: new Date() } },
      { tokenHash: 0 },
    );
  }

  // ── Private Helpers ───────────────────────────────────────────────────────
  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      orgId: user.organizationId?.toString(),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
    });

    const rawRefresh = crypto.randomBytes(64).toString('hex');
    return { accessToken, refreshToken: rawRefresh };
  }

  private async createSession(
    userId: Types.ObjectId,
    rawToken: string,
    meta: { ip: string; ua: string; device: string },
  ) {
    const hash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionModel.create({
      userId,
      tokenHash: hash,
      expiresAt,
      deviceInfo: meta.device,
      ipAddress: meta.ip,
      userAgent: meta.ua,
      lastUsedAt: new Date(),
    });
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private sanitizeUser(user: UserDocument) {
    const obj = user.toObject();
    delete (obj as any).passwordHash;
    delete (obj as any).aadhaarData;
    return obj;
  }
}
