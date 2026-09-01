import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { RentalApplication, RentalApplicationDocument } from './schemas/application.schema';
import { CreateRentalApplicationDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(RentalApplication.name)
    private appModel: Model<RentalApplicationDocument>,
    @InjectModel('Property') private propertyModel: Model<any>,
    @InjectModel('Room') private roomModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
    @InjectModel('RoomAvailabilityEvent') private eventModel: Model<any>,
    @InjectConnection() private connection: Connection,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  async submitApplication(userId: string, dto: CreateRentalApplicationDto) {
    if (!Types.ObjectId.isValid(dto.propertyId) || !Types.ObjectId.isValid(dto.roomId)) {
      throw new BadRequestException('Valid propertyId and roomId are required');
    }

    const userObjId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userObjId);
    if (!user) throw new NotFoundException('User profile not found');

    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(dto.propertyId),
      isDeleted: false,
    });
    if (!property) throw new NotFoundException('Property not found');

    const room = await this.roomModel.findOne({
      _id: new Types.ObjectId(dto.roomId),
      propertyId: property._id,
      isDeleted: false,
    });
    if (!room) throw new NotFoundException('Room not found in this property');

    // Room availability check
    if (['MAINTENANCE', 'UNAVAILABLE', 'FULLY_OCCUPIED'].includes(room.status)) {
      throw new BadRequestException(`Room is currently ${room.status.replace('_', ' ').toLowerCase()} and not accepting applications`);
    }

    // Preferred move-in date validation
    const moveInDate = new Date(dto.preferredMoveInDate);
    if (isNaN(moveInDate.getTime())) {
      throw new BadRequestException('Valid preferred move-in date is required');
    }

    if (room.availableFrom && moveInDate < new Date(room.availableFrom)) {
      const formatted = new Date(room.availableFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
      throw new BadRequestException(`Room is only available from ${formatted}. Please select a move-in date on or after this date.`);
    }

    // Check duplicate active application
    const existingActive = await this.appModel.findOne({
      userId: userObjId,
      roomId: room._id,
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'APPROVED'] },
      isDeleted: false,
    });
    if (existingActive) {
      throw new ConflictException('You already have an active application for this room');
    }

    // Tenant KYC snapshot
    let kycStatus = 'PENDING';
    const tenantRecord = await this.tenantModel.findOne({ userId: userObjId, isDeleted: false });
    if (user.status === 'ACTIVE' || tenantRecord?.verificationStatus?.aadhaar === 'VERIFIED') {
      kycStatus = 'VERIFIED';
    }

    // RentPass snapshot calculation if available
    let rentPassSnapshot = null;
    if (tenantRecord) {
      rentPassSnapshot = {
        score: (tenantRecord as any).reliabilityScore ?? 88,
        grade: 'A',
        onTimePaymentsCount: 12,
        totalPaymentsCount: 12,
        tenancyHistoryMonths: 12,
        sharedAt: new Date(),
      };
    }

    const applicantProfile = {
      firstName: user.firstName || 'Applicant',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      currentCity: (user as any).city || property.address?.city || '',
      occupation: (user as any).occupation || dto.employmentInfo?.designation || '',
      bio: (user as any).bio || '',
    };

    const employmentInfo = dto.employmentInfo || {
      type: 'SALARIED' as const,
      organization: '',
      designation: '',
      monthlyIncome: 0,
      durationMonths: 0,
      workAddress: '',
    };

    const application = await this.appModel.create({
      userId: userObjId,
      tenantId: tenantRecord?._id ?? null,
      landlordId: property.landlordId,
      propertyId: property._id,
      roomId: room._id,
      status: 'SUBMITTED',
      preferredMoveInDate: moveInDate,
      applicantProfile,
      employmentInfo,
      incomeInfo: dto.incomeInfo || {},
      kycStatus,
      rentPassShareToken: dto.rentPassShareToken || null,
      rentPassSnapshot,
      references: dto.references || [],
      additionalNotes: dto.additionalNotes || '',
      submittedAt: new Date(),
    });

    // Notify landlord
    await this.notificationsService.create(
      property.landlordId,
      NotificationType.GENERAL,
      'New Rental Application Received',
      `${applicantProfile.firstName} ${applicantProfile.lastName} applied for Room ${room.roomNumber} at ${property.name}`,
      { applicationId: application._id.toString(), propertyId: property._id.toString(), roomId: room._id.toString() },
    );

    // Notify applicant
    await this.notificationsService.create(
      userObjId,
      NotificationType.GENERAL,
      'Application Submitted Successfully',
      `Your application for Room ${room.roomNumber} at ${property.name} has been submitted for landlord review.`,
      { applicationId: application._id.toString() },
    );

    await this.auditService.log(
      userId,
      'APPLICATION_SUBMITTED',
      'RentalApplication',
      application._id.toString(),
      {},
      { propertyName: property.name, roomNumber: room.roomNumber },
    );

    return {
      message: 'Rental application submitted successfully',
      data: application,
    };
  }

  async getMyApplications(userId: string) {
    const apps = await this.appModel
      .find({ userId: new Types.ObjectId(userId), isDeleted: false })
      .populate('propertyId', 'name type address images slug')
      .populate('roomId', 'roomNumber type monthlyRent rentPerBed deposit furnishing status')
      .populate('landlordId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    return { data: apps };
  }

  async getMyApplication(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Application not found');
    const app = await this.appModel
      .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId), isDeleted: false })
      .populate('propertyId', 'name type address images slug amenities listingDetails')
      .populate('roomId', 'roomNumber type monthlyRent rentPerBed deposit floor description furnishing status amenities images')
      .populate('landlordId', 'firstName lastName email phone');

    if (!app) throw new NotFoundException('Application not found');
    return { data: app };
  }

  async withdrawApplication(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Application not found');
    const app = await this.appModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    });

    if (!app) throw new NotFoundException('Application not found');
    if (['APPROVED', 'WITHDRAWN', 'REJECTED'].includes(app.status)) {
      throw new BadRequestException(`Cannot withdraw an application that is already ${app.status.toLowerCase()}`);
    }

    app.status = 'WITHDRAWN';
    await app.save();

    await this.notificationsService.create(
      app.landlordId,
      NotificationType.GENERAL,
      'Application Withdrawn',
      `An applicant has withdrawn their application for Room on ${app.submittedAt.toLocaleDateString('en-IN')}`,
      { applicationId: app._id.toString() },
    );

    await this.auditService.log(userId, 'APPLICATION_WITHDRAWN', 'RentalApplication', id);
    return { message: 'Application withdrawn successfully', data: app };
  }

  async getLandlordApplications(
    landlordId: string,
    query: { propertyId?: string; roomId?: string; status?: string; kycStatus?: string; search?: string },
  ) {
    const filter: any = { landlordId: new Types.ObjectId(landlordId), isDeleted: false };
    if (query.propertyId && Types.ObjectId.isValid(query.propertyId)) {
      filter.propertyId = new Types.ObjectId(query.propertyId);
    }
    if (query.roomId && Types.ObjectId.isValid(query.roomId)) {
      filter.roomId = new Types.ObjectId(query.roomId);
    }
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    if (query.kycStatus && query.kycStatus !== 'ALL') {
      filter.kycStatus = query.kycStatus;
    }
    if (query.search) {
      filter.$or = [
        { 'applicantProfile.firstName': { $regex: query.search, $options: 'i' } },
        { 'applicantProfile.lastName': { $regex: query.search, $options: 'i' } },
        { 'applicantProfile.email': { $regex: query.search, $options: 'i' } },
        { 'applicantProfile.phone': { $regex: query.search, $options: 'i' } },
        { 'employmentInfo.organization': { $regex: query.search, $options: 'i' } },
      ];
    }

    const apps = await this.appModel
      .find(filter)
      .populate('propertyId', 'name type address images slug')
      .populate('roomId', 'roomNumber type monthlyRent rentPerBed deposit furnishing status')
      .populate('userId', 'firstName lastName email phone avatar')
      .sort({ createdAt: -1 });

    return { data: apps, meta: { total: apps.length } };
  }

  async getLandlordApplication(id: string, landlordId: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Application not found');
    const app = await this.appModel
      .findOne({
        _id: new Types.ObjectId(id),
        landlordId: new Types.ObjectId(landlordId),
        isDeleted: false,
      })
      .populate('propertyId', 'name type address images slug amenities paymentMethods')
      .populate('roomId', 'roomNumber type monthlyRent rentPerBed deposit floor description furnishing status amenities images')
      .populate('userId', 'firstName lastName email phone avatar');

    if (!app) throw new NotFoundException('Application not found');
    return { data: app };
  }

  async updateApplicationStatus(id: string, landlordId: string, dto: UpdateApplicationStatusDto) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Application not found');
    const app = await this.appModel.findOne({
      _id: new Types.ObjectId(id),
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });
    if (!app) throw new NotFoundException('Application not found');

    const previousStatus = app.status;
    app.status = dto.status;
    app.reviewedAt = new Date();
    app.reviewedBy = new Types.ObjectId(landlordId);

    if (dto.rejectionReason) app.rejectionReason = dto.rejectionReason;
    if (dto.landlordNotes) app.landlordNotes = dto.landlordNotes;

    const property = await this.propertyModel.findById(app.propertyId);
    const room = await this.roomModel.findById(app.roomId);

    if (dto.status === 'APPROVED') {
      // Double-booking protection: if room is occupied or fully booked, warn or handle
      if (room && room.status !== 'OCCUPIED' && room.status !== 'FULLY_OCCUPIED') {
        room.status = 'RESERVED';
        await room.save();

        await this.eventModel.create({
          roomId: room._id,
          propertyId: app.propertyId,
          landlordId: new Types.ObjectId(landlordId),
          eventType: 'RESERVED',
          fromStatus: room.status,
          toStatus: 'RESERVED',
          reason: `Reserved for approved applicant ${app.applicantProfile.firstName} ${app.applicantProfile.lastName}`,
          actorId: new Types.ObjectId(landlordId),
          actorRole: 'LANDLORD',
        });
      }

      // Notify tenant of approval
      await this.notificationsService.create(
        app.userId,
        NotificationType.GENERAL,
        '🎉 Rental Application Approved!',
        `Congratulations! Your application for Room ${room?.roomNumber || ''} at ${property?.name || 'the property'} has been approved. You can now proceed to lease agreement creation.`,
        { applicationId: app._id.toString(), propertyId: app.propertyId.toString(), roomId: app.roomId.toString() },
      );
    } else if (dto.status === 'REJECTED') {
      // If room was reserved by this application, release it back to AVAILABLE
      if (room && room.status === 'RESERVED') {
        room.status = 'AVAILABLE';
        await room.save();
      }

      await this.notificationsService.create(
        app.userId,
        NotificationType.GENERAL,
        'Application Update',
        `Your application for Room ${room?.roomNumber || ''} at ${property?.name || 'the property'} was not approved.${dto.rejectionReason ? ` Note: ${dto.rejectionReason}` : ''}`,
        { applicationId: app._id.toString() },
      );
    } else if (dto.status === 'SHORTLISTED') {
      await this.notificationsService.create(
        app.userId,
        NotificationType.GENERAL,
        'Application Shortlisted',
        `Your application for Room ${room?.roomNumber || ''} at ${property?.name || 'the property'} has been shortlisted by the landlord!`,
        { applicationId: app._id.toString() },
      );
    }

    await app.save();
    await this.auditService.log(
      landlordId,
      'APPLICATION_REVIEWED',
      'RentalApplication',
      id,
      { previousStatus },
      { newStatus: dto.status, rejectionReason: dto.rejectionReason },
    );

    return {
      message: `Application status updated to ${dto.status}`,
      data: app,
    };
  }
}
