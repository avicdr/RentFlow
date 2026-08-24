import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

@Injectable()
export class LoginThrottleService {
  private readonly logger = new Logger(LoginThrottleService.name);
  // In production, replace with Redis for multi-instance safety
  private readonly attempts = new Map<string, AttemptRecord>();

  /**
   * Call BEFORE verifying credentials.
   * Throws 429 if the IP+email is locked out.
   */
  checkThrottle(ip: string, email: string): void {
    const key = `${ip}:${email.toLowerCase()}`;
    const record = this.attempts.get(key);
    if (!record) return;

    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
      this.logger.warn(`[Security] Login blocked: ${key} (${remaining}m remaining)`);
      throw new UnauthorizedException(
        `Too many failed login attempts. Try again in ${remaining} minute${remaining > 1 ? 's' : ''}.`
      );
    }

    // Reset expired lockout window
    if (Date.now() - record.firstAttemptAt > LOCKOUT_WINDOW_MS) {
      this.attempts.delete(key);
    }
  }

  /**
   * Call AFTER a FAILED login attempt.
   */
  recordFailure(ip: string, email: string): void {
    const key = `${ip}:${email.toLowerCase()}`;
    const record = this.attempts.get(key) ?? { count: 0, firstAttemptAt: Date.now() };
    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      this.logger.warn(`[Security] Account locked out: ${key} (${record.count} attempts)`);
    }

    this.attempts.set(key, record);
  }

  /**
   * Call AFTER a SUCCESSFUL login.
   */
  recordSuccess(ip: string, email: string): void {
    const key = `${ip}:${email.toLowerCase()}`;
    this.attempts.delete(key);
  }

  /**
   * Return remaining attempts before lockout (for frontend feedback).
   */
  getRemainingAttempts(ip: string, email: string): number {
    const key = `${ip}:${email.toLowerCase()}`;
    const record = this.attempts.get(key);
    if (!record) return MAX_ATTEMPTS;
    return Math.max(0, MAX_ATTEMPTS - record.count);
  }
}
