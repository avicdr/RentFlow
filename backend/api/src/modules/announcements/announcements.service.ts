import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Announcement, AnnouncementDocument } from './schemas/announcement.schema';
import { CreateAnnouncementDto } from './dto/announcement.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private annModel: Model<AnnouncementDocument>,
    @InjectModel('User')
    private userModel: Model<any>,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateAnnouncementDto) {
    let expiresAt: Date;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
    } else if (dto.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(dto.expiresInDays));
    } else {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const ann = await this.annModel.create({
      title: dto.title.trim(),
      body: dto.body.trim(),
      targetRole: dto.targetRole || 'ALL',
      type: dto.type || 'INFO',
      expiresAt,
      pinned: !!dto.pinned,
      createdById: userId ? new Types.ObjectId(userId) : null,
    });

    // Notify targeted users asynchronously
    try {
      const userFilter: any = { status: 'ACTIVE', isDeleted: false };
      if (dto.targetRole && dto.targetRole !== 'ALL') {
        userFilter.role = dto.targetRole;
      }

      const users = await this.userModel.find(userFilter).select('_id').limit(1000).lean();
      for (const u of users) {
        if (u._id.toString() !== userId) {
          this.notificationsService.create(
            u._id.toString(),
            NotificationType.GENERAL,
            `Announcement: ${dto.title}`,
            dto.body.length > 120 ? `${dto.body.substring(0, 117)}...` : dto.body,
            { announcementId: ann._id.toString() },
          ).catch(() => {});
        }
      }
    } catch {}

    return { data: ann };
  }

  async findAll(userRole?: string) {
    const filter: any = { isDeleted: false };
    
    // Non-admin users only see announcements targeted to their role or ALL
    if (userRole && userRole !== 'SUPER_ADMIN') {
      filter.targetRole = { $in: ['ALL', userRole] };
      filter.expiresAt = { $gte: new Date() };
    }

    const list = await this.annModel
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return { data: list };
  }

  async findOne(id: string) {
    const ann = await this.annModel.findOne({ _id: new Types.ObjectId(id), isDeleted: false }).lean();
    if (!ann) throw new NotFoundException('Announcement not found');
    return { data: ann };
  }

  async remove(id: string) {
    const ann = await this.annModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true },
    );
    if (!ann) throw new NotFoundException('Announcement not found');

    // Cascade delete/hide all broadcasted notification records for this announcement
    await this.notificationsService.deleteByAnnouncementId(id);

    return { data: { success: true, message: 'Announcement and associated notifications deleted' } };
  }
}
