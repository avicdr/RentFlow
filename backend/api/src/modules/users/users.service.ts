import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private auditService: AuditService,
  ) {}

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash -aadhaarData');
    if (!user || user.isDeleted) throw new NotFoundException('User not found');
    return { data: user };
  }

  async updateProfile(id: string, dto: any) {
    const allowed = ['firstName', 'lastName', 'phone', 'profile'];
    const update: any = {};
    allowed.forEach(k => { if (dto[k] !== undefined) update[k] = dto[k]; });
    const user = await this.userModel.findByIdAndUpdate(id, update, { new: true }).select('-passwordHash');
    await this.auditService.log(id, 'PROFILE_UPDATED', 'User', id, {}, update);
    return { message: 'Profile updated', data: user };
  }

  async updateAvatar(id: string, avatarPath: string) {
    await this.userModel.updateOne({ _id: new Types.ObjectId(id) }, { 'profile.avatar': avatarPath });
    return { message: 'Avatar updated' };
  }

  async softDelete(id: string, adminId: string) {
    await this.userModel.updateOne({ _id: new Types.ObjectId(id) }, { isDeleted: true, deletedAt: new Date() });
    await this.auditService.log(adminId, 'USER_DELETED', 'User', id, {}, {}, 'CRITICAL');
    return { message: 'User deleted' };
  }
}
