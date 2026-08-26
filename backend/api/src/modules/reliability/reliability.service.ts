import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReliabilityScore, ReliabilityScoreDocument } from './schemas/reliability-score.schema';

@Injectable()
export class ReliabilityScoreService {
  constructor(
    @InjectModel(ReliabilityScore.name)
    private scoreModel: Model<ReliabilityScoreDocument>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Lease') private leaseModel: Model<any>,
  ) {}

  async getScoreByTenant(tenantIdOrUserId: string) {
    if (!Types.ObjectId.isValid(tenantIdOrUserId)) throw new NotFoundException('Invalid ID');
    const oid = new Types.ObjectId(tenantIdOrUserId);
    let score = await this.scoreModel.findOne({
      $or: [{ tenantId: oid }, { userId: oid }],
    });
    if (!score) {
      let tenant = await this.tenantModel.findById(oid);
      if (!tenant) {
        tenant = await this.tenantModel.findOne({ userId: oid, isDeleted: false });
      }
      if (tenant) {
        score = await this.calculateScore(tenant._id.toString(), 'Initial score calculation');
      }
    }
    return score;
  }

  async getScoreByUser(userId: string) {
    return this.getScoreByTenant(userId);
  }

  async calculateScore(tenantIdOrUserId: string, triggerReason = 'Periodic recalculation') {
    if (!Types.ObjectId.isValid(tenantIdOrUserId)) throw new NotFoundException('Invalid ID');
    const oid = new Types.ObjectId(tenantIdOrUserId);
    let tenant = await this.tenantModel.findById(oid);
    if (!tenant) {
      tenant = await this.tenantModel.findOne({ userId: oid, isDeleted: false });
    }
    if (!tenant) throw new NotFoundException('Tenant not found');

    const tid = tenant._id;
    const user = await this.userModel.findById(tenant.userId);

    // Fetch payments
    const payments = await this.paymentModel.find({ tenantId: tid, isDeleted: false });
    const paidPayments = payments.filter((p: any) => p.status === 'PAID');
    const latePayments = payments.filter((p: any) => {
      if (p.status === 'PAID' && p.paidAt && p.dueDate) {
        return new Date(p.paidAt) > new Date(p.dueDate);
      }
      return false;
    });
    const overduePayments = payments.filter((p: any) => {
      return ['PENDING', 'REJECTED'].includes(p.status) && p.dueDate && new Date(p.dueDate) < new Date();
    });

    // 1. Payment History Factor (0 - 100)
    let paymentScore = 90;
    if (payments.length > 0) {
      const onTimeRatio = (paidPayments.length - latePayments.length) / Math.max(1, paidPayments.length);
      paymentScore = Math.max(40, Math.min(100, Math.round(onTimeRatio * 100)));
      if (latePayments.length > 0) paymentScore -= latePayments.length * 5;
    }

    // 2. KYC Verification Factor (0 - 100)
    let kycScore = 70;
    const isKycVerified =
      tenant.verificationStatus?.aadhaar === 'VERIFIED' ||
      user?.aadhaarData?.verificationStatus === 'VERIFIED' ||
      user?.status === 'ACTIVE';
    if (isKycVerified) kycScore = 100;
    else if (tenant.verificationStatus?.aadhaar === 'PENDING') kycScore = 75;
    else if (tenant.verificationStatus?.aadhaar === 'REJECTED') kycScore = 40;

    // 3. Tenancy Stability Factor (0 - 100)
    let stabilityScore = 80;
    if (tenant.joiningDate) {
      const monthsTenancy = Math.max(
        1,
        (Date.now() - new Date(tenant.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      if (monthsTenancy >= 12) stabilityScore = 100;
      else if (monthsTenancy >= 6) stabilityScore = 90;
      else stabilityScore = 80;
    }

    // 4. Outstanding Dues Factor (0 - 100)
    let duesScore = 100;
    if (overduePayments.length > 0) {
      duesScore = Math.max(30, 100 - overduePayments.length * 20);
    }

    // 5. Agreement Status Factor (0 - 100)
    let agreementScore = 85;
    const activeLease = await this.leaseModel.findOne({ tenantId: tid, status: 'ACTIVE', isDeleted: false });
    if (activeLease) agreementScore = 100;
    else if (tenant.status === 'ACTIVE') agreementScore = 90;

    // Overall weighted calculation:
    // Payment History 35% | KYC 20% | Stability 20% | Dues 15% | Agreement 10%
    const calculatedTotal = Math.round(
      paymentScore * 0.35 +
      kycScore * 0.20 +
      stabilityScore * 0.20 +
      duesScore * 0.15 +
      agreementScore * 0.10,
    );

    const boundedScore = Math.max(10, Math.min(100, calculatedTotal));

    // Positive and Negative factors
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    if (paidPayments.length > 0 && latePayments.length === 0) {
      positiveFactors.push(`${paidPayments.length} consecutive on-time rent payment(s)`);
    }
    if (isKycVerified) {
      positiveFactors.push('Identity & KYC verified on RentFlow');
    }
    if (activeLease) {
      positiveFactors.push('Active verified lease agreement in good standing');
    }
    if (stabilityScore >= 90) {
      positiveFactors.push('Consistent tenancy stability (>6 months)');
    }
    if (duesScore === 100) {
      positiveFactors.push('Zero outstanding or overdue rent balances');
    }

    if (latePayments.length > 0) {
      negativeFactors.push(`${latePayments.length} late payment record(s) on file`);
    }
    if (overduePayments.length > 0) {
      negativeFactors.push(`${overduePayments.length} overdue rent payment(s) pending clearance`);
    }
    if (!isKycVerified) {
      negativeFactors.push('KYC document verification is pending');
    }

    // Previous score and event logging
    const existing = await this.scoreModel.findOne({ tenantId: tid });
    const prev = existing?.currentScore ?? boundedScore;
    const delta = boundedScore - prev;

    const event = {
      timestamp: new Date(),
      previousScore: prev,
      newScore: boundedScore,
      delta,
      reason: delta !== 0 ? triggerReason : 'Score verified and updated',
    };

    const updated = await this.scoreModel.findOneAndUpdate(
      { tenantId: tid },
      {
        $set: {
          userId: tenant.userId,
          currentScore: boundedScore,
          previousScore: prev,
          breakdown: {
            paymentHistory: paymentScore,
            kycVerification: kycScore,
            tenancyStability: stabilityScore,
            outstandingDues: duesScore,
            agreementStatus: agreementScore,
          },
          positiveFactors,
          negativeFactors,
          lastCalculatedAt: new Date(),
        },
        $push: {
          events: {
            $each: [event],
            $slice: -20, // Keep last 20 events
          },
        },
      },
      { upsert: true, new: true },
    );

    return updated;
  }
}
