import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// ─── Razorpay Pricing (in paise) ─────────────────────────────────────────────
// Unit-based 6-tier pricing × 2 billing cycles

const TIER_AMOUNTS_PAISE: Record<string, { monthly: number; annual: number }> = {
  LITE:         { monthly: 9900,     annual: 99000 },     // ₹99/mo   | ₹990/yr
  STARTER:      { monthly: 29900,    annual: 299000 },    // ₹299/mo  | ₹2,990/yr
  GROWTH:       { monthly: 69900,    annual: 699000 },    // ₹699/mo  | ₹6,990/yr
  PROFESSIONAL: { monthly: 149900,   annual: 1499000 },   // ₹1,499/mo | ₹14,990/yr
  BUSINESS:     { monthly: 299900,   annual: 2999000 },   // ₹2,999/mo | ₹29,990/yr
  // ENTERPRISE is custom — no fixed price
};

const TIER_NAMES: Record<string, string> = {
  LITE: 'RentFlow Lite',
  STARTER: 'RentFlow Starter',
  GROWTH: 'RentFlow Growth',
  PROFESSIONAL: 'RentFlow Professional',
  BUSINESS: 'RentFlow Business',
  ENTERPRISE: 'RentFlow Enterprise',
};

@Injectable()
export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rzp: any;

  constructor(private config: ConfigService) {
    this.keyId = this.config.get<string>('RAZORPAY_KEY_ID') ?? 'rzp_test_placeholder';
    this.keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET') ?? 'rzp_test_secret_placeholder';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Razorpay = require('razorpay');
      this.rzp = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
    } catch {
      // razorpay not installed — will use mock in development
      this.rzp = null;
    }
  }

  async createSubscriptionOrder(tier: string, landlordId: string, billingCycle: string = 'MONTHLY') {
    const tierAmounts = TIER_AMOUNTS_PAISE[tier];
    if (!tierAmounts) throw new BadRequestException(`Invalid subscription tier: ${tier}`);

    const cycle = billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
    const amount = cycle === 'ANNUAL' ? tierAmounts.annual : tierAmounts.monthly;
    const receiptId = `sub_${landlordId.slice(-8)}_${tier}_${cycle}_${Date.now()}`;

    if (!this.rzp) {
      // Mock order for local dev when razorpay package not installed
      return {
        id: `order_mock_${Date.now()}`,
        amount,
        currency: 'INR',
        receipt: receiptId,
        status: 'created',
        keyId: this.keyId,
        tierName: TIER_NAMES[tier],
        billingCycle: cycle,
      };
    }

    const order = await this.rzp.orders.create({
      amount,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        landlordId,
        tier,
        billingCycle: cycle,
        description: `${TIER_NAMES[tier]} ${cycle === 'ANNUAL' ? 'Annual' : 'Monthly'} Subscription`,
      },
    });

    return { ...order, keyId: this.keyId, tierName: TIER_NAMES[tier], billingCycle: cycle };
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');
    // Constant-time comparison to avoid leaking match progress via timing.
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(signature ?? '', 'utf8');
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }

  /**
   * Resolve the tier the user actually paid for from the Razorpay order itself,
   * NOT from client input. The order's `notes.tier`/`amount` were set server-side at
   * create time, so a client cannot pay for a cheap tier and claim an expensive one.
   */
  async getVerifiedTierForOrder(orderId: string, landlordId: string): Promise<{ tier: string; billingCycle: string }> {
    if (!this.rzp) {
      // razorpay package not installed (local dev mock) — no gateway to verify against.
      throw new BadRequestException('Payment gateway is not configured');
    }

    const order = await this.rzp.orders.fetch(orderId);
    if (!order) throw new BadRequestException('Order not found');

    const tier = order.notes?.tier;
    const billingCycle = order.notes?.billingCycle ?? 'MONTHLY';
    const tierAmounts = TIER_AMOUNTS_PAISE[tier];
    if (!tier || !tierAmounts) throw new BadRequestException('Order has no recognised tier');

    const expectedAmount = billingCycle === 'ANNUAL' ? tierAmounts.annual : tierAmounts.monthly;
    if (Number(order.amount) !== expectedAmount)
      throw new BadRequestException('Order amount does not match tier');
    if (order.notes?.landlordId && order.notes.landlordId !== landlordId)
      throw new BadRequestException('Order does not belong to this account');
    // Ensure the order was actually paid, not merely created.
    if (order.status !== 'paid' && Number(order.amount_paid) < expectedAmount)
      throw new BadRequestException('Order has not been fully paid');

    return { tier, billingCycle };
  }
}
