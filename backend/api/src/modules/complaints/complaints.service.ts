import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Complaint, ComplaintDocument } from './schemas/complaint.schema';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectModel(Complaint.name) private complaintModel: Model<ComplaintDocument>,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, role: string, dto: any) {
    if (!dto.landlordId) throw new BadRequestException('landlordId is required');
    if (!dto.propertyId) throw new BadRequestException('propertyId is required');
    if (!dto.title) throw new BadRequestException('title is required');
    if (!dto.description) throw new BadRequestException('description is required');
    if (!Types.ObjectId.isValid(dto.landlordId) || !Types.ObjectId.isValid(dto.propertyId))
      throw new BadRequestException('Invalid landlordId or propertyId');
    if (dto.roomId && !Types.ObjectId.isValid(dto.roomId))
      throw new BadRequestException('Invalid roomId');

    // Whitelist client-provided fields — never spread the raw dto, or a caller could inject
    // status/assignedTo/timeline/isDeleted and forge complaint state.
    const complaint = await this.complaintModel.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority,
      attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
      raisedBy: new Types.ObjectId(userId),
      raisedByRole: role,
      landlordId: new Types.ObjectId(dto.landlordId),
      propertyId: new Types.ObjectId(dto.propertyId),
      roomId: dto.roomId ? new Types.ObjectId(dto.roomId) : undefined,
      organizationId: new Types.ObjectId(dto.landlordId),
      timeline: [{ action: 'OPENED', performedBy: new Types.ObjectId(userId), timestamp: new Date() }],
    });

    if (role === 'TENANT') {
      await this.notificationsService.create(
        complaint.landlordId, NotificationType.COMPLAINT_UPDATE,
        '🔔 New Complaint',
        `A tenant raised a complaint: "${dto.title}"`,
        { complaintId: complaint._id.toString() },
      );
    }

    await this.auditService.log(userId, 'COMPLAINT_CREATED', 'Complaint', complaint._id.toString(), {}, { title: dto.title });
    return { message: 'Complaint raised', data: complaint };
  }

  async findAll(userId: string, role: string, query: any) {
    const page  = Math.max(1, +(query.page  ?? 1));
    const limit = Math.min(50, +(query.limit ?? 20));
    const match: any = { isDeleted: false };

    if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.complaintModel.db.model('PropertyManagerAssignment');
      const assignments = await assignmentModel.find({
        userId: new Types.ObjectId(userId),
        status: 'ACTIVE',
        isDeleted: false,
      }).select('propertyId');
      const assignedPropIds = assignments.map((a: any) => a.propertyId);

      if (query.propertyId) {
        const matches = assignedPropIds.some((p: any) => p.toString() === query.propertyId);
        if (!matches) throw new ForbiddenException('You do not have access to this property');
        match.propertyId = new Types.ObjectId(query.propertyId);
      } else {
        match.propertyId = { $in: assignedPropIds };
      }
    } else if (role === 'LANDLORD') {
      match.landlordId = new Types.ObjectId(userId);
      if (query.propertyId) match.propertyId = new Types.ObjectId(query.propertyId);
    } else if (role === 'TENANT') {
      match.raisedBy = new Types.ObjectId(userId);
      if (query.propertyId) match.propertyId = new Types.ObjectId(query.propertyId);
    }
    // SUPER_ADMIN: no filter — sees all complaints

    if (query.status)     match.status     = query.status;
    if (query.priority)   match.priority   = query.priority;
    if (query.category)   match.category   = query.category;

    const basePipeline: any[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$raisedBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
            { $project: { firstName: 1, lastName: 1, email: 1 } },
          ],
          as: '_raisedByArr',
        },
      },
      {
        $lookup: {
          from: 'properties',
          let: { pid: '$propertyId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$pid'] } } },
            { $project: { name: 1 } },
          ],
          as: '_propertyArr',
        },
      },
      {
        $addFields: {
          raisedBy:   { $arrayElemAt: ['$_raisedByArr', 0] },
          propertyId: { $arrayElemAt: ['$_propertyArr', 0] },
        },
      },
      { $unset: ['_raisedByArr', '_propertyArr'] },
    ];

    const [complaints, countResult] = await Promise.all([
      this.complaintModel.aggregate([
        ...basePipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
      this.complaintModel.aggregate([
        ...basePipeline,
        { $count: 'total' },
      ]),
    ]);

    const total = countResult[0]?.total ?? 0;
    return { data: complaints, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string, role: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Complaint not found');
    const complaint = await this.complaintModel
      .findById(id)
      .populate('raisedBy', 'firstName lastName email')
      .populate('propertyId', 'name address')
      .populate('assignedTo', 'firstName lastName');
    if (!complaint || complaint.isDeleted) throw new NotFoundException('Complaint not found');

    await this.assertCanAccess(complaint, userId, role);
    return { data: complaint };
  }

  // Landlords/PMs may only touch their own complaints; tenants only the ones they raised.
  private async assertCanAccess(complaint: ComplaintDocument, userId: string, role: string) {
    if (role === 'SUPER_ADMIN') return;
    const raisedById = (complaint.raisedBy as any)?._id?.toString() ?? complaint.raisedBy?.toString();
    if (role === 'LANDLORD') {
      if (complaint.landlordId?.toString() !== userId) throw new ForbiddenException('Access denied');
    } else if (role === 'PROPERTY_MANAGER') {
      const assignmentModel = this.complaintModel.db.model('PropertyManagerAssignment');
      const propId = (complaint.propertyId as any)?._id || complaint.propertyId;
      const assignment = await assignmentModel.findOne({
        userId: new Types.ObjectId(userId),
        propertyId: propId,
        status: 'ACTIVE',
        isDeleted: false,
      });
      if (!assignment) throw new ForbiddenException('Access denied');
    } else if (role === 'TENANT') {
      if (raisedById !== userId) throw new ForbiddenException('Access denied');
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  async updateStatus(id: string, userId: string, role: string, status: string, note?: string) {
    if (!['LANDLORD', 'PROPERTY_MANAGER', 'SUPER_ADMIN'].includes(role))
      throw new ForbiddenException('You are not allowed to change complaint status');
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Complaint not found');

    const complaint = await this.complaintModel.findById(id);
    if (!complaint || complaint.isDeleted) throw new NotFoundException('Complaint not found');
    await this.assertCanAccess(complaint, userId, role);

    const update: any = { status };
    if (status === 'RESOLVED') {
      update.resolvedAt = new Date();
      update.resolutionNote = note ?? '';
    }

    const timelineEntry = {
      action: `STATUS_CHANGED_TO_${status}`,
      performedBy: new Types.ObjectId(userId),
      note: note ?? '',
      timestamp: new Date(),
    };

    await this.complaintModel.updateOne({ _id: complaint._id }, {
      $set: update,
      $push: { timeline: timelineEntry },
    });

    const raisedById = complaint.raisedBy
      ? (complaint.raisedBy as any)?._id?.toString() ?? complaint.raisedBy.toString()
      : null;

    if (raisedById) {
      await this.notificationsService.create(
        raisedById,
        NotificationType.COMPLAINT_UPDATE,
        'Complaint Update',
        `Your complaint "${complaint.title}" is now ${status.replace(/_/g, ' ')}.`,
        { complaintId: id },
      );
    }

    await this.auditService.log(userId, 'COMPLAINT_STATUS_UPDATED', 'Complaint', id, { status: complaint.status }, { status });
    return { message: 'Status updated' };
  }
}
