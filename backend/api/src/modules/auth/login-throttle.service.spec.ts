import { describe, it, expect, beforeEach } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { LoginThrottleService } from './login-throttle.service';

describe('LoginThrottleService', () => {
  let svc: LoginThrottleService;
  const ip = '1.2.3.4';
  const email = 'user@example.com';

  beforeEach(() => {
    svc = new LoginThrottleService();
  });

  it('allows login attempts when there is no prior failure', () => {
    expect(() => svc.checkThrottle(ip, email)).not.toThrow();
    expect(svc.getRemainingAttempts(ip, email)).toBe(5);
  });

  it('decrements remaining attempts on each failure', () => {
    svc.recordFailure(ip, email);
    expect(svc.getRemainingAttempts(ip, email)).toBe(4);
    svc.recordFailure(ip, email);
    expect(svc.getRemainingAttempts(ip, email)).toBe(3);
  });

  it('locks out the IP+email after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) svc.recordFailure(ip, email);
    expect(() => svc.checkThrottle(ip, email)).toThrow(UnauthorizedException);
    expect(svc.getRemainingAttempts(ip, email)).toBe(0);
  });

  it('does NOT lock out before the threshold', () => {
    for (let i = 0; i < 4; i++) svc.recordFailure(ip, email);
    expect(() => svc.checkThrottle(ip, email)).not.toThrow();
  });

  it('clears the counter on a successful login', () => {
    for (let i = 0; i < 4; i++) svc.recordFailure(ip, email);
    svc.recordSuccess(ip, email);
    expect(svc.getRemainingAttempts(ip, email)).toBe(5);
    expect(() => svc.checkThrottle(ip, email)).not.toThrow();
  });

  it('tracks IP+email pairs independently', () => {
    for (let i = 0; i < 5; i++) svc.recordFailure(ip, email);
    // A different email from the same IP is not affected.
    expect(() => svc.checkThrottle(ip, 'other@example.com')).not.toThrow();
    // A different IP for the same email is not affected.
    expect(() => svc.checkThrottle('9.9.9.9', email)).not.toThrow();
  });

  it('normalises email case so casing cannot bypass the lockout', () => {
    for (let i = 0; i < 5; i++) svc.recordFailure(ip, email);
    expect(() => svc.checkThrottle(ip, 'USER@EXAMPLE.COM')).toThrow(UnauthorizedException);
  });
});
