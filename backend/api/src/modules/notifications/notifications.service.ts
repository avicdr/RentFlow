import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
  ) {}

  async create(userId: string | Types.ObjectId, type: NotificationType, title: string, body: string, data?: Record<string, string>) {
    // Extract string ID from populated object, raw ObjectId, or string
    const rawId = (userId as any)?._id ?? userId;
    if (!rawId) return null; // Skip silently if no valid userId
    const userObjId = new Types.ObjectId(rawId.toString());
    return this.notifModel.create({ userId: userObjId, type, title, body, data: data ?? {} });
  }

  async findAll(userId: string, page = 1, limit = 20, isRead?: boolean) {
    const filter: any = { userId: new Types.ObjectId(userId), isDeleted: false };
    if (isRead !== undefined) filter.isRead = isRead;

    const [notifications, total] = await Promise.all([
      this.notifModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.notifModel.countDocuments(filter),
    ]);

    return {
      data: notifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markRead(id: string, userId: string) {
    return this.notifModel.updateOne(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { isRead: true },
    );
  }

  async markAllRead(userId: string) {
    return this.notifModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
      isDeleted: false,
    });
  }

  async deleteByAnnouncementId(announcementId: string) {
    return this.notifModel.updateMany(
      { 'data.announcementId': announcementId },
      { $set: { isDeleted: true } },
    );
  }
}
