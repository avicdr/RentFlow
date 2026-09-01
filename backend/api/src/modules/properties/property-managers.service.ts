import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import {
  PropertyManagerAssignment,
  PropertyManagerAssignmentDocument,
  ManagerAssignmentStatus,
  ManagerPermissions,
} from './schemas/property-manager-assignment.schema';
import { User, UserDocument, UserRole, UserStatus } from '../users/schemas/user.schema';
import { Property, PropertyDocument } from './schemas/property.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { AuditService } from '../audit/audit.service';
import {
  InvitePropertyManagerDto,
  AssignPropertiesDto,
  UpdateManagerPermissionsDto,
  AcceptManagerInviteDto,
  ManagerPermissionsDto,
} from './dto/property-manager.dto';

@Injectable()
export class PropertyManagersService {
  constructor(
    @InjectModel(PropertyManagerAssignment.name)
    private assignmentModel: Model<PropertyManagerAssignmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectConnection() private connection: Connection,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  /**
   * Helper: verify landlord owns the specified properties
   */
  private async validateLandlordProperties(landlordId: string, propertyIds: string[]): Promise<PropertyDocument[]> {
    if (!propertyIds || propertyIds.length === 0) {
      throw new BadRequestException('At least one propertyId is required');
    }
    const validObjectIds = propertyIds.filter(id => Types.ObjectId.isValid(id)).map(id => new Types.ObjectId(id));
    if (validObjectIds.length !== propertyIds.length) {
      throw new BadRequestException('Invalid property ID provided');
    }

    const properties = await this.propertyModel.find({
      _id: { $in: validObjectIds },
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });

    if (properties.length !== propertyIds.length) {
      throw new ForbiddenException('One or more selected properties do not belong to you or do not exist');
    }

    return properties;
  }

  /**
   * Invite a new or existing user as Property Manager for specific properties
   */
  async inviteManager(landlordId: string, dto: InvitePropertyManagerDto) {
    const properties = await this.validateLandlordProperties(landlordId, dto.propertyIds);
    const email = dto.email.toLowerCase().trim();

    let user = await this.userModel.findOne({ email });
    let isNewUser = false;
    const inviteToken = crypto.randomBytes(24).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (user) {
      // If user exists, don't create duplicate. If their role is TENANT, elevate/assign PM role if appropriate
      if (user.role === UserRole.TENANT) {
        user.role = UserRole.PROPERTY_MANAGER;
        await user.save();
      }
    } else {
      isNewUser = true;
      const tempPassword = crypto.randomBytes(12).toString('hex');
      const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

      user = await this.userModel.create({
        firstName: dto.firstName.trim(),
        lastName: (dto.lastName || '').trim(),
        email,
        phone: dto.phone?.trim() || undefined,
        passwordHash,
        role: UserRole.PROPERTY_MANAGER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      });
    }

    const landlordUser = await this.userModel.findById(landlordId);
    const landlordName = landlordUser ? `${landlordUser.firstName} ${landlordUser.lastName}`.trim() : 'The Property Owner';

    const defaultPermissions: ManagerPermissions = {
      viewTenants: dto.permissions?.viewTenants ?? true,
      manageTenants: dto.permissions?.manageTenants ?? true,
      viewRooms: dto.permissions?.viewRooms ?? true,
      manageRooms: dto.permissions?.manageRooms ?? true,
      viewPayments: dto.permissions?.viewPayments ?? true,
      recordPayments: dto.permissions?.recordPayments ?? true,
      viewMaintenance: dto.permissions?.viewMaintenance ?? true,
      manageMaintenance: dto.permissions?.manageMaintenance ?? true,
      viewDocuments: dto.permissions?.viewDocuments ?? true,
      uploadDocuments: dto.permissions?.uploadDocuments ?? true,
      viewProperty: dto.permissions?.viewProperty ?? true,
      editProperty: dto.permissions?.editProperty ?? false,
      deleteProperty: dto.permissions?.deleteProperty ?? false,
      manageSettings: dto.permissions?.manageSettings ?? false,
    };

    const createdAssignments = [];

    for (const property of properties) {
      // Check existing active or soft-deleted assignment
      let assignment = await this.assignmentModel.findOne({
        userId: user._id,
        propertyId: property._id,
      });

      if (assignment) {
        assignment.isDeleted = false;
        assignment.deletedAt = undefined;
        assignment.status = ManagerAssignmentStatus.ACTIVE;
        assignment.landlordId = new Types.ObjectId(landlordId);
        assignment.permissions = defaultPermissions;
        assignment.inviteToken = inviteToken;
        assignment.inviteExpiresAt = inviteExpiresAt;
        assignment.invitedAt = new Date();
        await assignment.save();
      } else {
        assignment = await this.assignmentModel.create({
          userId: user._id,
          propertyId: property._id,
          landlordId: new Types.ObjectId(landlordId),
          status: ManagerAssignmentStatus.ACTIVE,
          permissions: defaultPermissions,
          inviteToken,
          inviteExpiresAt,
          invitedAt: new Date(),
          isDeleted: false,
        });
      }
      createdAssignments.push(assignment);
    }

    // Send in-app notification
    await this.notificationsService.create(
      user._id,
      NotificationType.GENERAL,
      '🏢 Assigned as Property Manager',
      `${landlordName} assigned you as Property Manager for ${properties.length} property(s): ${properties.map(p => p.name).join(', ')}.`,
      { assignedPropertyIds: properties.map(p => p._id.toString()).join(',') },
    );

    // Audit log
    await this.auditService.log(
      landlordId,
      'MANAGER_INVITED',
      'PropertyManagerAssignment',
      user._id.toString(),
      {},
      {
        managerEmail: email,
        managerName: `${user.firstName} ${user.lastName}`.trim(),
        assignedProperties: properties.map(p => ({ id: p._id, name: p.name })),
        isNewUser,
      },
    );

    return {
      message: isNewUser
        ? 'Property manager invited successfully. Account created and assigned.'
        : 'Existing user successfully assigned as Property Manager.',
      data: {
        manager: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        assignedCount: createdAssignments.length,
        properties: properties.map(p => ({ id: p._id, name: p.name, slug: p.slug })),
        inviteToken,
      },
    };
  }

  /**
   * List all property managers under an owner/landlord's properties
   */
  async listLandlordManagers(landlordId: string) {
    const landlordObjId = new Types.ObjectId(landlordId);

    const assignments = await this.assignmentModel
      .find({
        landlordId: landlordObjId,
        isDeleted: false,
      })
      .populate('userId', 'firstName lastName email phone avatar status')
      .populate('propertyId', 'name slug address type totalRooms totalBeds occupiedBeds')
      .sort({ createdAt: -1 });

    // Group by manager (userId)
    const managerMap = new Map<string, {
      user: any;
      assignments: any[];
      status: string;
      createdAt: Date;
    }>();

    for (const a of assignments) {
      if (!a.userId) continue;
      const uid = (a.userId as any)._id?.toString() || a.userId.toString();

      if (!managerMap.has(uid)) {
        managerMap.set(uid, {
          user: a.userId,
          assignments: [],
          status: a.status,
          createdAt: (a as any).createdAt,
        });
      }

      managerMap.get(uid)!.assignments.push({
        assignmentId: a._id,
        property: a.propertyId,
        permissions: a.permissions,
        status: a.status,
        invitedAt: a.invitedAt,
        acceptedAt: a.acceptedAt,
      });
    }

    const result = Array.from(managerMap.values()).map(item => ({
      manager: item.user,
      propertiesCount: item.assignments.length,
      assignments: item.assignments,
      status: item.status,
      createdAt: item.createdAt,
    }));

    return { data: result, meta: { total: result.length } };
  }

  /**
   * Get detailed manager info with their property assignments under a landlord
   */
  async getManagerDetails(managerId: string, landlordId: string) {
    if (!Types.ObjectId.isValid(managerId)) throw new NotFoundException('Manager not found');

    const user = await this.userModel.findById(managerId).select('-passwordHash');
    if (!user) throw new NotFoundException('Manager user not found');

    const assignments = await this.assignmentModel
      .find({
        userId: new Types.ObjectId(managerId),
        landlordId: new Types.ObjectId(landlordId),
        isDeleted: false,
      })
      .populate('propertyId', 'name slug address type totalRooms totalBeds occupiedBeds status');

    return {
      data: {
        manager: user,
        assignments: assignments.map(a => ({
          assignmentId: a._id,
          property: a.propertyId,
          permissions: a.permissions,
          status: a.status,
          invitedAt: a.invitedAt,
          acceptedAt: a.acceptedAt,
        })),
      },
    };
  }

  /**
   * Assign manager to additional properties
   */
  async assignProperties(managerId: string, landlordId: string, dto: AssignPropertiesDto) {
    if (!Types.ObjectId.isValid(managerId)) throw new NotFoundException('Manager not found');
    const user = await this.userModel.findById(managerId);
    if (!user) throw new NotFoundException('Manager user not found');

    const properties = await this.validateLandlordProperties(landlordId, dto.propertyIds);

    const defaultPermissions: ManagerPermissions = {
      viewTenants: dto.permissions?.viewTenants ?? true,
      manageTenants: dto.permissions?.manageTenants ?? true,
      viewRooms: dto.permissions?.viewRooms ?? true,
      manageRooms: dto.permissions?.manageRooms ?? true,
      viewPayments: dto.permissions?.viewPayments ?? true,
      recordPayments: dto.permissions?.recordPayments ?? true,
      viewMaintenance: dto.permissions?.viewMaintenance ?? true,
      manageMaintenance: dto.permissions?.manageMaintenance ?? true,
      viewDocuments: dto.permissions?.viewDocuments ?? true,
      uploadDocuments: dto.permissions?.uploadDocuments ?? true,
      viewProperty: dto.permissions?.viewProperty ?? true,
      editProperty: dto.permissions?.editProperty ?? false,
      deleteProperty: dto.permissions?.deleteProperty ?? false,
      manageSettings: dto.permissions?.manageSettings ?? false,
    };

    const updatedAssignments = [];

    for (const property of properties) {
      let assignment = await this.assignmentModel.findOne({
        userId: user._id,
        propertyId: property._id,
      });

      if (assignment) {
        assignment.isDeleted = false;
        assignment.deletedAt = undefined;
        assignment.status = ManagerAssignmentStatus.ACTIVE;
        assignment.landlordId = new Types.ObjectId(landlordId);
        assignment.permissions = defaultPermissions;
        await assignment.save();
      } else {
        assignment = await this.assignmentModel.create({
          userId: user._id,
          propertyId: property._id,
          landlordId: new Types.ObjectId(landlordId),
          status: ManagerAssignmentStatus.ACTIVE,
          permissions: defaultPermissions,
          isDeleted: false,
        });
      }
      updatedAssignments.push(assignment);
    }

    await this.auditService.log(
      landlordId,
      'MANAGER_ASSIGNED',
      'PropertyManagerAssignment',
      user._id.toString(),
      {},
      {
        managerId,
        managerEmail: user.email,
        assignedProperties: properties.map(p => ({ id: p._id, name: p.name })),
      },
    );

    return {
      message: 'Properties assigned successfully',
      data: {
        assignedCount: updatedAssignments.length,
        properties: properties.map(p => ({ id: p._id, name: p.name })),
      },
    };
  }

  /**
   * Remove a manager from a specific property
   */
  async removePropertyAssignment(managerId: string, propertyId: string, landlordId: string) {
    if (!Types.ObjectId.isValid(managerId) || !Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Valid managerId and propertyId are required');
    }

    const assignment = await this.assignmentModel.findOne({
      userId: new Types.ObjectId(managerId),
      propertyId: new Types.ObjectId(propertyId),
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });

    if (!assignment) {
      throw new NotFoundException('Property assignment not found');
    }

    assignment.isDeleted = true;
    assignment.deletedAt = new Date();
    assignment.status = ManagerAssignmentStatus.REVOKED;
    await assignment.save();

    await this.auditService.log(
      landlordId,
      'MANAGER_REMOVED',
      'PropertyManagerAssignment',
      assignment._id.toString(),
      {},
      { managerId, propertyId },
    );

    return { message: 'Manager removed from property successfully' };
  }

  /**
   * Update permissions for a specific property assignment
   */
  async updatePermissions(
    managerId: string,
    propertyId: string,
    landlordId: string,
    dto: UpdateManagerPermissionsDto,
  ) {
    if (!Types.ObjectId.isValid(managerId) || !Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException('Valid managerId and propertyId are required');
    }

    const assignment = await this.assignmentModel.findOne({
      userId: new Types.ObjectId(managerId),
      propertyId: new Types.ObjectId(propertyId),
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });

    if (!assignment) throw new NotFoundException('Property assignment not found');

    const before = assignment.permissions;
    assignment.permissions = {
      ...assignment.permissions,
      ...dto.permissions,
    };
    await assignment.save();

    await this.auditService.log(
      landlordId,
      'MANAGER_PERMISSIONS_UPDATED',
      'PropertyManagerAssignment',
      assignment._id.toString(),
      before as any,
      dto.permissions as unknown as Record<string, unknown>,
    );

    return { message: 'Manager permissions updated successfully', data: assignment };
  }

  /**
   * List all managers assigned to a specific property
   */
  async getManagersForProperty(propertyId: string, landlordId: string) {
    if (!Types.ObjectId.isValid(propertyId)) throw new BadRequestException('Valid propertyId is required');

    const property = await this.propertyModel.findOne({
      _id: new Types.ObjectId(propertyId),
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });
    if (!property) throw new NotFoundException('Property not found');

    const assignments = await this.assignmentModel
      .find({
        propertyId: property._id,
        isDeleted: false,
      })
      .populate('userId', 'firstName lastName email phone avatar status');

    return {
      data: assignments.map(a => ({
        assignmentId: a._id,
        manager: a.userId,
        permissions: a.permissions,
        status: a.status,
        invitedAt: a.invitedAt,
        acceptedAt: a.acceptedAt,
      })),
    };
  }

  /**
   * Get all properties assigned to the logged-in Property Manager
   */
  async getMyAssignedProperties(userId: string) {
    const userObjId = new Types.ObjectId(userId);

    const assignments = await this.assignmentModel
      .find({
        userId: userObjId,
        status: ManagerAssignmentStatus.ACTIVE,
        isDeleted: false,
      })
      .populate('propertyId')
      .populate('landlordId', 'firstName lastName email phone');

    const result = assignments
      .filter(a => a.propertyId && !(a.propertyId as any).isDeleted)
      .map(a => ({
        assignmentId: a._id,
        property: a.propertyId,
        permissions: a.permissions,
        landlord: a.landlordId,
        assignedAt: a.invitedAt,
      }));

    return { data: result, meta: { total: result.length } };
  }

  /**
   * Get assigned property IDs for a Property Manager
   */
  async getAssignedPropertyIds(userId: string): Promise<Types.ObjectId[]> {
    const assignments = await this.assignmentModel
      .find({
        userId: new Types.ObjectId(userId),
        status: ManagerAssignmentStatus.ACTIVE,
        isDeleted: false,
      })
      .select('propertyId');

    return assignments.map(a => a.propertyId);
  }

  /**
   * Check if a user has access to a specific property (Owner OR Assigned Manager)
   */
  async hasPropertyAccess(
    userId: string,
    role: string,
    propertyId: string | Types.ObjectId,
    requiredPermission?: keyof ManagerPermissions,
  ): Promise<boolean> {
    if (role === 'SUPER_ADMIN') return true;

    const propId = typeof propertyId === 'string' ? new Types.ObjectId(propertyId) : propertyId;
    const userObjId = new Types.ObjectId(userId);

    if (role === 'LANDLORD') {
      const property = await this.propertyModel.findOne({ _id: propId, landlordId: userObjId, isDeleted: false });
      return !!property;
    }

    if (role === 'PROPERTY_MANAGER') {
      const assignment = await this.assignmentModel.findOne({
        userId: userObjId,
        propertyId: propId,
        status: ManagerAssignmentStatus.ACTIVE,
        isDeleted: false,
      });

      if (!assignment) return false;

      if (requiredPermission && assignment.permissions) {
        return Boolean(assignment.permissions[requiredPermission]);
      }

      return true;
    }

    return false;
  }

  /**
   * Deactivate a manager across all properties for a landlord
   */
  async deactivateManager(managerId: string, landlordId: string) {
    if (!Types.ObjectId.isValid(managerId)) throw new NotFoundException('Manager not found');

    await this.assignmentModel.updateMany(
      {
        userId: new Types.ObjectId(managerId),
        landlordId: new Types.ObjectId(landlordId),
        isDeleted: false,
      },
      {
        $set: {
          status: ManagerAssignmentStatus.REVOKED,
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
    );

    await this.auditService.log(
      landlordId,
      'MANAGER_DEACTIVATED',
      'PropertyManagerAssignment',
      managerId,
    );

    return { message: 'Manager access revoked across all your properties' };
  }

  /**
   * Resend invitation to a manager
   */
  async resendInvite(managerId: string, landlordId: string) {
    if (!Types.ObjectId.isValid(managerId)) throw new NotFoundException('Manager not found');

    const user = await this.userModel.findById(managerId);
    if (!user) throw new NotFoundException('User not found');

    const assignments = await this.assignmentModel.find({
      userId: user._id,
      landlordId: new Types.ObjectId(landlordId),
      isDeleted: false,
    });

    if (assignments.length === 0) {
      throw new NotFoundException('No active assignments found for this manager');
    }

    const inviteToken = crypto.randomBytes(24).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.assignmentModel.updateMany(
      {
        userId: user._id,
        landlordId: new Types.ObjectId(landlordId),
        isDeleted: false,
      },
      {
        $set: {
          inviteToken,
          inviteExpiresAt,
          invitedAt: new Date(),
        },
      },
    );

    await this.notificationsService.create(
      user._id,
      NotificationType.GENERAL,
      '🏢 Property Manager Invitation Reminder',
      `You have pending property manager assignments on RentFlow.`,
    );

    return { message: 'Invitation resent successfully', data: { inviteToken } };
  }
}
