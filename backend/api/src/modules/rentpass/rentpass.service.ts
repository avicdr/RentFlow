import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { RentPassShare, RentPassShareDocument } from './schemas/rentpass-share.schema';
import { CreateRentPassShareDto } from './dto/rentpass.dto';
import { ReliabilityScoreService } from '../reliability/reliability.service';

@Injectable()
export class RentPassService {
  constructor(
    @InjectModel(RentPassShare.name)
    private shareModel: Model<RentPassShareDocument>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Property') private propertyModel: Model<any>,
    @InjectModel('Lease') private leaseModel: Model<any>,
    private reliabilityService: ReliabilityScoreService,
  ) {}

  async getRentPassByUser(userId: string) {
    const uid = new Types.ObjectId(userId);
    const tenant = await this.tenantModel.findOne({ userId: uid, isDeleted: false });
    if (!tenant) throw new NotFoundException('Tenant profile not found');

    return this.buildRentPassData(tenant._id.toString(), uid.toString());
  }

  async createShareLink(userId: string, dto: CreateRentPassShareDto) {
    const uid = new Types.ObjectId(userId);
    const tenant = await this.tenantModel.findOne({ userId: uid, isDeleted: false });
    if (!tenant) throw new NotFoundException('Tenant profile not found');

    const token = crypto.randomBytes(24).toString('hex');
    const expiryDays = dto.expiryDays || 30;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const share = await this.shareModel.create({
      tenantId: tenant._id,
      userId: uid,
      token,
      label: dto.label || 'Rental Application Share',
      expiresAt,
      privacySettings: {
        showScore: dto.showScore ?? true,
        showRentalHistory: dto.showRentalHistory ?? true,
        showKYCStatus: dto.showKYCStatus ?? true,
        showPaymentConsistency: dto.showPaymentConsistency ?? true,
      },
    });

    return {
      message: 'RentPass share link generated',
      data: {
        shareId: share._id,
        token: share.token,
        expiresAt: share.expiresAt,
        shareUrl: `/rentpass/view/${share.token}`,
      },
    };
  }

  async getMyShareLinks(userId: string) {
    const uid = new Types.ObjectId(userId);
    const shares = await this.shareModel
      .find({ userId: uid })
      .sort({ createdAt: -1 })
      .lean();

    return { data: shares };
  }

  async revokeShareLink(userId: string, shareId: string) {
    const uid = new Types.ObjectId(userId);
    const share = await this.shareModel.findOneAndUpdate(
      { _id: new Types.ObjectId(shareId), userId: uid },
      { $set: { isRevoked: true } },
      { new: true },
    );
    if (!share) throw new NotFoundException('Share link not found');
    return { message: 'Share link revoked successfully' };
  }

  async getPublicRentPass(token: string) {
    const share = await this.shareModel.findOne({ token });
    if (!share) throw new NotFoundException('RentPass link is invalid or not found');

    if (share.isRevoked) {
      throw new BadRequestException('This RentPass link has been revoked by the tenant');
    }

    if (new Date() > new Date(share.expiresAt)) {
      throw new BadRequestException('This RentPass link has expired');
    }

    // Increment views
    await this.shareModel.updateOne(
      { _id: share._id },
      { $inc: { viewsCount: 1 }, $set: { lastViewedAt: new Date() } },
    );

    const fullData = await this.buildRentPassData(share.tenantId.toString(), share.userId.toString());

    // Apply privacy filter
    const filtered: any = {
      tenantName: fullData.tenant.fullName,
      avatar: fullData.tenant.avatar,
      verifiedMemberSince: fullData.tenant.memberSince,
      isVerifiedRentFlowTenant: true,
      expiresAt: share.expiresAt,
    };

    if (share.privacySettings.showScore) {
      filtered.reliabilityScore = fullData.reliabilityScore;
    }
    if (share.privacySettings.showKYCStatus) {
      filtered.kycStatus = fullData.kycStatus;
    }
    if (share.privacySettings.showPaymentConsistency) {
      filtered.paymentConsistency = fullData.paymentConsistency;
    }
    if (share.privacySettings.showRentalHistory) {
      filtered.rentalHistory = fullData.rentalHistory;
    }

    return { data: filtered };
  }

  private async buildRentPassData(tenantId: string, userId: string) {
    const tid = new Types.ObjectId(tenantId);
    const uid = new Types.ObjectId(userId);

    const [userData, tenantData, allTenancies, payments, scoreData] = await Promise.all([
      this.userModel.findById(uid).lean(),
      this.tenantModel.findById(tid).populate('propertyId', 'name address type').lean(),
      this.tenantModel.find({ userId: uid }).populate('propertyId', 'name address type city state').lean(),
      this.paymentModel.find({ tenantId: tid, isDeleted: false }).lean(),
      this.reliabilityService.getScoreByTenant(tenantId),
    ]);

    const user: any = userData;
    const tenant: any = tenantData;

    if (!user) throw new NotFoundException('User record not found');

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

    const totalRentPaid = paidPayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
    const totalOutstandingDues = overduePayments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

    // Calculate total months rented
    let totalMonthsRented = 0;
    allTenancies.forEach((t: any) => {
      if (t.joiningDate) {
        const end = t.vacatingDate ? new Date(t.vacatingDate).getTime() : Date.now();
        const start = new Date(t.joiningDate).getTime();
        const diffMonths = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
        totalMonthsRented += diffMonths;
      }
    });

    const onTimePaymentsCount = Math.max(0, paidPayments.length - latePayments.length);
    const onTimeRate = paidPayments.length > 0 ? Math.round((onTimePaymentsCount / paidPayments.length) * 100) : 100;

    const isKycVerified =
      tenant?.verificationStatus?.aadhaar === 'VERIFIED' ||
      user.aadhaarData?.verificationStatus === 'VERIFIED' ||
      user.status === 'ACTIVE';

    return {
      tenant: {
        fullName: `${user.firstName} ${user.lastName}`,
        emailMasked: user.email.replace(/(.{2})(.*)(?=@)/, '$1***'),
        phoneMasked: user.phone ? user.phone.replace(/(\d{2})(\d{6})(\d{2})/, '$1******$3') : '',
        avatar: user.profile?.avatar || '',
        memberSince: user.createdAt,
      },
      reliabilityScore: {
        score: scoreData.currentScore,
        breakdown: scoreData.breakdown,
        positiveFactors: scoreData.positiveFactors,
        negativeFactors: scoreData.negativeFactors,
      },
      kycStatus: {
        isVerified: isKycVerified,
        aadhaarStatus: tenant?.verificationStatus?.aadhaar || 'VERIFIED',
        policeVerification: tenant?.verificationStatus?.police || 'NOT_REQUIRED',
      },
      paymentConsistency: {
        totalPaidRent: totalRentPaid,
        totalTransactions: paidPayments.length,
        onTimePayments: onTimePaymentsCount,
        latePayments: latePayments.length,
        onTimeRate,
        outstandingDues: totalOutstandingDues,
      },
      rentalHistory: {
        totalPropertiesRented: allTenancies.length,
        totalMonthsRented: Math.max(1, totalMonthsRented),
        currentProperty: tenant?.propertyId
          ? {
              name: tenant.propertyId.name,
              type: tenant.propertyId.type,
              city: tenant.propertyId.address?.city,
              state: tenant.propertyId.address?.state,
              since: tenant.joiningDate,
            }
          : null,
        history: allTenancies.map((t: any) => ({
          propertyName: t.propertyId?.name ?? 'Property',
          city: t.propertyId?.address?.city ?? '',
          durationMonths: t.joiningDate
            ? Math.max(1, Math.round(((t.vacatingDate ? new Date(t.vacatingDate).getTime() : Date.now()) - new Date(t.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))
            : 1,
          status: t.status,
        })),
      },
    };
  }
}
