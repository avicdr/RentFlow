import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization } from './schemas/organization.schema';

export const SUBSCRIPTION_TIERS: Record<string, { label: string; propertyLimit: number; price: number; description: string }> = {
  SOLO: { label: 'Solo', propertyLimit: 1, price: 499, description: 'Perfect for individual landlords managing 1 property' },
  GROWTH: { label: 'Growth', propertyLimit: 5, price: 1499, description: 'For growing portfolios with 2–5 properties' },
  SCALE: { label: 'Scale', propertyLimit: 10, price: 2999, description: 'Scale your rental business with up to 10 properties' },
  ENTERPRISE: { label: 'Enterprise', propertyLimit: 999, price: 4999, description: 'Unlimited properties for large-scale operations' },
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<any>,
    @InjectModel('Property') private propertyModel: Model<any>,
  ) {}

  async getOrCreateOrg(landlordId: string) {
    let org = await this.orgModel.findOne({ ownerId: new Types.ObjectId(landlordId), isDeleted: false });
    if (!org) {
      org = await this.orgModel.create({
        name: 'My Organization',
        ownerId: new Types.ObjectId(landlordId),
        tier: 'SOLO',
        propertyLimit: 1,
        subscriptionStatus: 'ACTIVE',
      });
    }
    return org;
  }

  async canAddProperty(landlordId: string): Promise<{ allowed: boolean; currentCount: number; limit: number; tier: string; upgradeMessage?: string }> {
    const org = await this.getOrCreateOrg(landlordId);
    const currentCount = await this.propertyModel.countDocuments({ landlordId: new Types.ObjectId(landlordId), isDeleted: false });
    const limit = org.propertyLimit;
    const tier = org.tier;
    const allowed = currentCount < limit;
    if (!allowed) {
      const nextTier = tier === 'SOLO' ? 'Growth' : tier === 'GROWTH' ? 'Scale' : 'Enterprise';
      return {
        allowed: false,
        currentCount,
        limit,
        tier,
        upgradeMessage: `Your ${SUBSCRIPTION_TIERS[tier].label} plan allows up to ${limit} properties. Upgrade to ${nextTier} to add more.`,
      };
    }
    return { allowed: true, currentCount, limit, tier };
  }

  async upgradeTier(landlordId: string, newTier: string) {
    if (!SUBSCRIPTION_TIERS[newTier]) throw new ForbiddenException('Invalid tier');
    const org = await this.getOrCreateOrg(landlordId);
    const { propertyLimit } = SUBSCRIPTION_TIERS[newTier];
    await this.orgModel.updateOne({ _id: org._id }, { tier: newTier, propertyLimit });
    return { message: `Upgraded to ${SUBSCRIPTION_TIERS[newTier].label}`, tier: newTier };
  }

  async getSubscription(landlordId: string) {
    const org = await this.getOrCreateOrg(landlordId);
    const currentCount = await this.propertyModel.countDocuments({ landlordId: new Types.ObjectId(landlordId), isDeleted: false });
    const tierInfo = SUBSCRIPTION_TIERS[org.tier] ?? SUBSCRIPTION_TIERS.SOLO;
    return {
      org,
      tier: org.tier,
      tierInfo,
      currentCount,
      limit: org.propertyLimit,
      allTiers: SUBSCRIPTION_TIERS,
    };
  }
}
