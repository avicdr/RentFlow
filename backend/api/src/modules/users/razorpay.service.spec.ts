import { describe, it, expect, beforeEach } from '@jest/globals';
import * as crypto from 'crypto';
import { RazorpayService } from './razorpay.service';

// Minimal ConfigService stub returning a fixed key secret.
const KEY_SECRET = 'test_key_secret_value';
const configStub = {
  get: (key: string) => {
    if (key === 'RAZORPAY_KEY_SECRET') return KEY_SECRET;
    if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_id';
    return undefined;
  },
} as any;

function sign(orderId: string, paymentId: string, secret = KEY_SECRET) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('RazorpayService.verifyPaymentSignature', () => {
  let svc: RazorpayService;

  beforeEach(() => {
    svc = new RazorpayService(configStub);
  });

  it('accepts a correctly-signed payment', () => {
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const signature = sign(orderId, paymentId);
    expect(svc.verifyPaymentSignature(orderId, paymentId, signature)).toBe(true);
  });

  it('rejects a signature made with the wrong secret', () => {
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const bad = sign(orderId, paymentId, 'attacker_secret');
    expect(svc.verifyPaymentSignature(orderId, paymentId, bad)).toBe(false);
  });

  it('rejects a signature for a different order/payment', () => {
    const good = sign('order_ABC123', 'pay_XYZ789');
    expect(svc.verifyPaymentSignature('order_OTHER', 'pay_XYZ789', good)).toBe(false);
  });

  it('rejects an empty or malformed signature without throwing', () => {
    expect(svc.verifyPaymentSignature('order_ABC123', 'pay_XYZ789', '')).toBe(false);
    expect(svc.verifyPaymentSignature('order_ABC123', 'pay_XYZ789', 'short')).toBe(false);
    // Non-hex, wrong length — must not throw from timingSafeEqual.
    expect(() => svc.verifyPaymentSignature('order_ABC123', 'pay_XYZ789', 'zzzz')).not.toThrow();
  });
});
