import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Organization } from './schemas/organization.schema';

// ─── Centralized Plan Configuration ──────────────────────────────────────────
// This is the single source of truth for all RentFlow subscription plans.
// Pricing is based on RENTAL UNITS, not properties.

export interface PlanConfig {
  label: string;
  unitLimit: number;
  monthlyPrice: number; // in INR
  annualPrice: number;  // in INR
  priceDisplay: string;
  annualDisplay: string;
  isEnterprise: boolean;
  description: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  LITE: {
    label: 'Lite',
    unitLimit: 5,
    monthlyPrice: 99,
    annualPrice: 990,
    priceDisplay: '₹99/mo',
    annualDisplay: '₹990/yr',
    isEnterprise: false,
    description: 'Perfect for individual landlords managing up to 5 units',
    features: ['Up to 5 rental units', 'Unlimited properties', 'UPI & Razorpay payments', 'Digital tenant KYC', 'PDF rent receipts', 'Payment tracking'],
  },
  STARTER: {
    label: 'Starter',
    unitLimit: 25,
    monthlyPrice: 299,
    annualPrice: 2990,
    priceDisplay: '₹299/mo',
    annualDisplay: '₹2,990/yr',
    isEnterprise: false,
    description: 'For small landlords with multiple rental units',
    features: ['Up to 25 rental units', 'Unlimited properties', 'Everything in Lite', 'Bulk room configurator', 'Tenant applications', 'RentPass™ checks', 'Vacancy tracker'],
  },
  GROWTH: {
    label: 'Growth',
    unitLimit: 75,
    monthlyPrice: 699,
    annualPrice: 6990,
    priceDisplay: '₹699/mo',
    annualDisplay: '₹6,990/yr',
    isEnterprise: false,
    description: 'For PG owners & growing rental businesses',
    features: ['Up to 75 rental units', 'Unlimited properties', 'Everything in Starter', 'Room availability calendar', 'Public property page', 'Utility billing', 'Revenue analytics', 'Priority chat support'],
  },
  PROFESSIONAL: {
    label: 'Professional',
    unitLimit: 200,
    monthlyPrice: 1499,
    annualPrice: 14990,
    priceDisplay: '₹1,499/mo',
    annualDisplay: '₹14,990/yr',
    isEnterprise: false,
    description: 'For large PGs & professional property managers',
    features: ['Up to 200 rental units', 'Unlimited properties', 'Everything in Growth', 'AI lease agreement analyzer', 'Custom branding', 'Financial reports', 'Manager roles', '24/7 support'],
  },
  BUSINESS: {
    label: 'Business',
    unitLimit: 500,
    monthlyPrice: 2999,
    annualPrice: 29990,
    priceDisplay: '₹2,999/mo',
    annualDisplay: '₹29,990/yr',
    isEnterprise: false,
    description: 'For large property operators & hostel chains',
    features: ['Up to 500 rental units', 'Unlimited properties', 'Everything in Professional', 'Multi-property dashboard', 'Tenant onboarding flows', 'Dedicated account manager', 'Webhook integrations'],
  },
  ENTERPRISE: {
    label: 'Enterprise',
    unitLimit: 999999,
    monthlyPrice: 0,
    annualPrice: 0,
    priceDisplay: 'Custom',
    annualDisplay: 'Custom',
    isEnterprise: true,
    description: 'For institutional portfolios — custom pricing',
    features: ['500+ rental units', 'Unlimited properties', 'Custom onboarding', 'Custom contracts & SLA', 'Dedicated support', 'Custom integrations', 'Enterprise reporting'],
  },
};

// Map legacy tier names from old schema to new plan keys
const LEGACY_TIER_MAP: Record<string, string> = {
  SOLO: 'LITE',
  SCALE: 'PROFESSIONAL',
};

const PLAN_ORDER = ['LITE', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'];

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<any>,
    @InjectConnection() private connection: Connection,
  ) { }

  private get propertyModel(): Model<any> {
    return this.connection.model('Property');
  }

  private get roomModel(): Model<any> {
    return this.connection.model('Room');
  }

  private get tenantModel(): Model<any> {
    return this.connection.model('Tenant');
  }

  /** Normalize legacy tier names to the current 6-plan set */
  private normalizeTier(tier: string): string {
    return LEGACY_TIER_MAP[tier] ?? (SUBSCRIPTION_PLANS[tier] ? tier : 'LITE');
  }

  async getOrCreateOrg(landlordId: string) {
    let org = await this.orgModel.findOne({ ownerId: new Types.ObjectId(landlordId), isDeleted: false });
    if (!org) {
      org = await this.orgModel.create({
        name: 'My Organization',
        ownerId: new Types.ObjectId(landlordId),
        tier: 'LITE',
        unitLimit: SUBSCRIPTION_PLANS.LITE.unitLimit,
        billingCycle: 'MONTHLY',
        subscriptionStatus: 'ACTIVE',
      });
    } else {
      // Migrate legacy tiers on first access
      const normalized = this.normalizeTier(org.tier);
      if (normalized !== org.tier) {
        const plan = SUBSCRIPTION_PLANS[normalized];
        await this.orgModel.updateOne({ _id: org._id }, { tier: normalized, unitLimit: plan.unitLimit });
        org.tier = normalized;
        org.unitLimit = plan.unitLimit;
      }
    }
    return org;
  }

  /** Count the total managed (non-deleted) rooms across all of a landlord's properties */
  async getManagedUnitsCount(landlordId: string): Promise<number> {
    const properties = await this.propertyModel.find(
      { landlordId: new Types.ObjectId(landlordId), isDeleted: false },
      { _id: 1 },
    );
    if (properties.length === 0) return 0;
    const propertyIds = properties.map((p: any) => p._id);
    return this.roomModel.countDocuments({ propertyId: { $in: propertyIds }, isDeleted: false });
  }

  /** Check whether the landlord can add `countToAdd` new units within their plan limit */
  async canAddUnits(landlordId: string, countToAdd = 1): Promise<{
    allowed: boolean; currentUnits: number; limit: number; tier: string; upgradeMessage?: string; nextTier?: string;
  }> {
    const org = await this.getOrCreateOrg(landlordId);
    const currentUnits = await this.getManagedUnitsCount(landlordId);
    const limit = org.unitLimit;
    const tier = org.tier;
    const allowed = (currentUnits + countToAdd) <= limit;

    if (!allowed) {
      const currentIdx = PLAN_ORDER.indexOf(tier);
      const nextTierKey = currentIdx < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIdx + 1] : null;
      const nextPlan = nextTierKey ? SUBSCRIPTION_PLANS[nextTierKey] : null;
      return {
        allowed: false,
        currentUnits,
        limit,
        tier,
        nextTier: nextTierKey ?? undefined,
        upgradeMessage: nextPlan
          ? `You've reached your ${SUBSCRIPTION_PLANS[tier].label} plan limit (${limit} units). You're currently managing ${currentUnits} of ${limit} units. Upgrade to ${nextPlan.label} to manage up to ${nextPlan.unitLimit} units.`
          : `You've reached the maximum unit limit for your current plan. Contact sales for Enterprise pricing.`,
      };
    }
    return { allowed: true, currentUnits, limit, tier };
  }

  /**
   * Keep canAddProperty for backward compat — properties are now unlimited.
   * Always returns allowed: true.
   */
  async canAddProperty(landlordId: string): Promise<{ allowed: boolean; currentCount: number; limit: number; tier: string }> {
    const org = await this.getOrCreateOrg(landlordId);
    const currentCount = await this.propertyModel.countDocuments({ landlordId: new Types.ObjectId(landlordId), isDeleted: false });
    return { allowed: true, currentCount, limit: 999999, tier: org.tier };
  }

  async upgradeTier(landlordId: string, newTier: string, billingCycle?: string) {
    const normalizedTier = this.normalizeTier(newTier);
    if (!SUBSCRIPTION_PLANS[normalizedTier]) throw new ForbiddenException('Invalid plan');
    const plan = SUBSCRIPTION_PLANS[normalizedTier];
    const org = await this.getOrCreateOrg(landlordId);

    // Downgrade safety: reject if current units exceed target plan limit
    const currentUnits = await this.getManagedUnitsCount(landlordId);
    if (currentUnits > plan.unitLimit) {
      throw new ForbiddenException(
        `You currently manage ${currentUnits} units, but ${plan.label} supports up to ${plan.unitLimit} units. Reduce your managed units to ${plan.unitLimit} or fewer before downgrading.`,
      );
    }

    const cycle = billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
    await this.orgModel.updateOne({ _id: org._id }, { tier: normalizedTier, unitLimit: plan.unitLimit, billingCycle: cycle });
    return { message: `Plan updated to ${plan.label}`, tier: normalizedTier, billingCycle: cycle };
  }

  async getSubscription(landlordId: string) {
    const org = await this.getOrCreateOrg(landlordId);
    const planInfo = SUBSCRIPTION_PLANS[org.tier] ?? SUBSCRIPTION_PLANS.LITE;

    const [managedUnits, totalProperties, activeTenants] = await Promise.all([
      this.getManagedUnitsCount(landlordId),
      this.propertyModel.countDocuments({ landlordId: new Types.ObjectId(landlordId), isDeleted: false }),
      this.tenantModel.countDocuments({ landlordId: new Types.ObjectId(landlordId), status: { $in: ['ACTIVE', 'NOTICE_PERIOD'] }, isDeleted: false }),
    ]);

    return {
      org,
      tier: org.tier,
      billingCycle: org.billingCycle ?? 'MONTHLY',
      planInfo,
      managedUnits,
      unitLimit: org.unitLimit,
      unitsRemaining: Math.max(0, org.unitLimit - managedUnits),
      totalProperties,
      activeTenants,
      allPlans: SUBSCRIPTION_PLANS,
    };
  }
}
