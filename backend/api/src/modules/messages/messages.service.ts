import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendMessageDto } from './dto/message.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name)
    private convModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private msgModel: Model<MessageDocument>,
    @InjectModel('User')
    private userModel: Model<any>,
    @InjectModel(Tenant.name)
    private tenantModel: Model<TenantDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async getConversations(userId: string) {
    const uid = new Types.ObjectId(userId);
    const conversations = await this.convModel
      .find({ participants: uid, isDeleted: false })
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = await Promise.all(
      conversations.map(async (c: any) => {
        // Find the other participant ID
        const otherId = c.participants?.find((p: any) => {
          const idStr = p?._id?.toString() || p?.toString();
          return idStr && idStr !== userId;
        }) || c.participants?.[0];

        let otherUser: any = null;
        let tenantInfo: any = null;

        if (otherId) {
          const otherOid = new Types.ObjectId(otherId?._id?.toString() || otherId?.toString());
          const userDoc = await this.userModel.findById(otherOid).select('firstName lastName email phone role profile').lean();
          if (userDoc) {
            otherUser = userDoc;
          }

          const tenantDoc = await this.tenantModel
            .findOne({ userId: otherOid, isDeleted: false })
            .populate('roomId', 'roomNumber type')
            .populate('propertyId', 'name address')
            .lean();

          if (tenantDoc) {
            tenantInfo = {
              tenantId: tenantDoc._id,
              roomNumber: (tenantDoc as any).roomId?.roomNumber || null,
              roomType: (tenantDoc as any).roomId?.type || null,
              propertyName: (tenantDoc as any).propertyId?.name || null,
              status: tenantDoc.status,
            };
          }
        }

        let propertyName = tenantInfo?.propertyName || null;
        if (!propertyName && c.propertyId) {
          const propDoc = await this.convModel.db.collection('properties').findOne({ _id: new Types.ObjectId(c.propertyId) });
          propertyName = propDoc?.name || null;
        }

        return {
          ...c,
          otherUser: otherUser || {
            _id: otherId,
            firstName: 'Tenant',
            lastName: '',
          },
          tenantInfo: {
            roomNumber: tenantInfo?.roomNumber || null,
            roomType: tenantInfo?.roomType || null,
            propertyName: propertyName || 'Property Resident',
            status: tenantInfo?.status || 'ACTIVE',
          },
        };
      }),
    );

    return { data: enriched };
  }

  async getUnreadCount(userId: string) {
    const uid = new Types.ObjectId(userId);
    const count = await this.msgModel.countDocuments({ receiverId: uid, isRead: false, isDeleted: false });
    return { data: { count } };
  }

  async getMessages(conversationId: string, userId: string, query: { page?: number; limit?: number }) {
    const cid = new Types.ObjectId(conversationId);
    const uid = new Types.ObjectId(userId);

    const conversation = await this.convModel.findOne({ _id: cid, participants: uid, isDeleted: false });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const page = Math.max(1, +(query.page ?? 1));
    const limit = Math.min(100, +(query.limit ?? 50));

    const [messages, total] = await Promise.all([
      this.msgModel
        .find({ conversationId: cid, isDeleted: false })
        .populate('senderId', 'firstName lastName role profile')
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.msgModel.countDocuments({ conversationId: cid, isDeleted: false }),
    ]);

    // Mark unread messages sent to current user as read
    await this.msgModel.updateMany(
      { conversationId: cid, receiverId: uid, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );

    // Reset unread count for current user
    if (conversation.unreadCounts && conversation.unreadCounts[userId]) {
      await this.convModel.updateOne(
        { _id: cid },
        { $set: { [`unreadCounts.${userId}`]: 0 } },
      );
    }

    return { data: messages, meta: { total, page, limit } };
  }

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const sId = new Types.ObjectId(senderId);
    let conversation: ConversationDocument | null = null;
    let rId: Types.ObjectId | null = null;

    if (dto.conversationId) {
      conversation = await this.convModel.findOne({
        _id: new Types.ObjectId(dto.conversationId),
        participants: sId,
        isDeleted: false,
      });
      if (!conversation) throw new NotFoundException('Conversation not found');
      rId = conversation.participants.find(p => p.toString() !== senderId) || null;
    } else if (dto.receiverId) {
      rId = new Types.ObjectId(dto.receiverId);
      const receiver = await this.userModel.findById(rId);
      if (!receiver) throw new NotFoundException('Recipient not found');

      // Find existing direct conversation or create new
      conversation = await this.convModel.findOne({
        participants: { $all: [sId, rId] },
        isDeleted: false,
      });

      if (!conversation) {
        conversation = await this.convModel.create({
          participants: [sId, rId],
          propertyId: dto.propertyId ? new Types.ObjectId(dto.propertyId) : null,
          unreadCounts: { [senderId]: 0, [dto.receiverId]: 0 },
        });
      }
    } else {
      throw new BadRequestException('Must provide either conversationId or receiverId');
    }

    if (!rId) throw new BadRequestException('Recipient could not be determined');

    const message = await this.msgModel.create({
      conversationId: conversation._id,
      senderId: sId,
      receiverId: rId,
      content: dto.content,
      attachments: dto.attachments ?? [],
    });

    const sender = await this.userModel.findById(sId);
    const receiverIdStr = rId.toString();
    const currentUnread = conversation.unreadCounts?.[receiverIdStr] || 0;

    await this.convModel.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessage: {
            text: dto.content,
            senderId: sId,
            timestamp: new Date(),
          },
          [`unreadCounts.${receiverIdStr}`]: currentUnread + 1,
        },
      },
    );

    // Notify receiver
    await this.notificationsService.create(
      rId,
      NotificationType.GENERAL,
      `💬 New message from ${sender?.firstName || 'User'}`,
      dto.content.length > 60 ? `${dto.content.substring(0, 57)}...` : dto.content,
      { conversationId: conversation._id.toString(), messageId: message._id.toString() },
    );

    return { message: 'Message sent', data: message };
  }
}
