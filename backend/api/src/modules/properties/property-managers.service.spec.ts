import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PropertyManagersService } from './property-managers.service';
import { PropertyManagerAssignment, ManagerAssignmentStatus } from './schemas/property-manager-assignment.schema';
import { User, UserRole, UserStatus } from '../users/schemas/user.schema';
import { Property } from './schemas/property.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('PropertyManagersService', () => {
  let service: PropertyManagersService;
  let mockAssignmentModel: any;
  let mockUserModel: any;
  let mockPropertyModel: any;
  let mockNotificationsService: any;
  let mockAuditService: any;
  let mockConnection: any;

  const mockLandlordId = new Types.ObjectId().toString();
  const mockManagerId = new Types.ObjectId().toString();
  const mockPropertyAId = new Types.ObjectId().toString();
  const mockPropertyBId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockAssignmentModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    };

    mockUserModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    mockPropertyModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
    };

    mockNotificationsService = {
      create: jest.fn().mockResolvedValue(true),
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue(true),
    };

    mockConnection = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyManagersService,
        { provide: getModelToken(PropertyManagerAssignment.name), useValue: mockAssignmentModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Property.name), useValue: mockPropertyModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PropertyManagersService>(PropertyManagersService);
  });

  describe('inviteManager', () => {
    it('should assign an existing user without creating duplicate account', async () => {
      const existingUser = {
        _id: new Types.ObjectId(mockManagerId),
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul@example.com',
        role: UserRole.TENANT,
        save: jest.fn().mockResolvedValue(true),
      };

      const propertyA = {
        _id: new Types.ObjectId(mockPropertyAId),
        name: 'Green Residency',
        slug: 'green-residency',
        landlordId: new Types.ObjectId(mockLandlordId),
        isDeleted: false,
      };

      mockPropertyModel.find.mockResolvedValue([propertyA]);
      mockUserModel.findOne.mockResolvedValue(existingUser);
      mockUserModel.findById.mockResolvedValue({ firstName: 'Owner', lastName: 'Landlord' });
      mockAssignmentModel.findOne.mockResolvedValue(null);
      mockAssignmentModel.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: existingUser._id,
        propertyId: propertyA._id,
        landlordId: new Types.ObjectId(mockLandlordId),
        status: ManagerAssignmentStatus.ACTIVE,
      });

      const res = await service.inviteManager(mockLandlordId, {
        firstName: 'Rahul',
        email: 'rahul@example.com',
        propertyIds: [mockPropertyAId],
      });

      expect(res.data.manager.email).toBe('rahul@example.com');
      expect(mockUserModel.create).not.toHaveBeenCalled();
      expect(mockAssignmentModel.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        mockLandlordId,
        'MANAGER_INVITED',
        'PropertyManagerAssignment',
        existingUser._id.toString(),
        {},
        expect.objectContaining({ isNewUser: false }),
      );
    });

    it('should create a new user account if email does not exist', async () => {
      const propertyA = {
        _id: new Types.ObjectId(mockPropertyAId),
        name: 'Green Residency',
        slug: 'green-residency',
        landlordId: new Types.ObjectId(mockLandlordId),
        isDeleted: false,
      };

      const newCreatedUser = {
        _id: new Types.ObjectId(mockManagerId),
        firstName: 'Priya',
        lastName: 'Singh',
        email: 'priya@example.com',
        role: UserRole.PROPERTY_MANAGER,
        status: UserStatus.ACTIVE,
      };

      mockPropertyModel.find.mockResolvedValue([propertyA]);
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(newCreatedUser);
      mockUserModel.findById.mockResolvedValue({ firstName: 'Owner', lastName: 'Landlord' });
      mockAssignmentModel.findOne.mockResolvedValue(null);
      mockAssignmentModel.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: newCreatedUser._id,
        propertyId: propertyA._id,
        status: ManagerAssignmentStatus.ACTIVE,
      });

      const res = await service.inviteManager(mockLandlordId, {
        firstName: 'Priya',
        lastName: 'Singh',
        email: 'priya@example.com',
        propertyIds: [mockPropertyAId],
      });

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'priya@example.com',
          role: UserRole.PROPERTY_MANAGER,
        }),
      );
      expect(res.data.assignedCount).toBe(1);
    });

    it('should reject if property does not belong to landlord', async () => {
      mockPropertyModel.find.mockResolvedValue([]); // No matching property for this landlord

      await expect(
        service.inviteManager(mockLandlordId, {
          firstName: 'Rahul',
          email: 'rahul@example.com',
          propertyIds: [mockPropertyAId],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('hasPropertyAccess & Property Scoping', () => {
    it('should allow LANDLORD if they own the property', async () => {
      mockPropertyModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockPropertyAId),
        landlordId: new Types.ObjectId(mockLandlordId),
      });

      const hasAccess = await service.hasPropertyAccess(mockLandlordId, 'LANDLORD', mockPropertyAId);
      expect(hasAccess).toBe(true);
    });

    it('should allow PROPERTY_MANAGER if assigned to the property', async () => {
      mockAssignmentModel.findOne.mockResolvedValue({
        userId: new Types.ObjectId(mockManagerId),
        propertyId: new Types.ObjectId(mockPropertyAId),
        status: ManagerAssignmentStatus.ACTIVE,
        permissions: {
          viewRooms: true,
          manageRooms: true,
          recordPayments: false,
        },
      });

      const canManageRooms = await service.hasPropertyAccess(
        mockManagerId,
        'PROPERTY_MANAGER',
        mockPropertyAId,
        'manageRooms',
      );
      expect(canManageRooms).toBe(true);

      const canRecordPayments = await service.hasPropertyAccess(
        mockManagerId,
        'PROPERTY_MANAGER',
        mockPropertyAId,
        'recordPayments',
      );
      expect(canRecordPayments).toBe(false);
    });

    it('should reject PROPERTY_MANAGER if not assigned to the property', async () => {
      mockAssignmentModel.findOne.mockResolvedValue(null);

      const hasAccess = await service.hasPropertyAccess(mockManagerId, 'PROPERTY_MANAGER', mockPropertyBId);
      expect(hasAccess).toBe(false);
    });
  });

  describe('removePropertyAssignment', () => {
    it('should soft-delete assignment and revoke access', async () => {
      const mockAssignment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(mockManagerId),
        propertyId: new Types.ObjectId(mockPropertyAId),
        landlordId: new Types.ObjectId(mockLandlordId),
        status: ManagerAssignmentStatus.ACTIVE,
        isDeleted: false,
        save: jest.fn().mockResolvedValue(true),
      };

      mockAssignmentModel.findOne.mockResolvedValue(mockAssignment);

      const res = await service.removePropertyAssignment(mockManagerId, mockPropertyAId, mockLandlordId);
      expect(res.message).toContain('Manager removed from property successfully');
      expect(mockAssignment.isDeleted).toBe(true);
      expect(mockAssignment.status).toBe(ManagerAssignmentStatus.REVOKED);
      expect(mockAssignment.save).toHaveBeenCalled();
    });
  });
});
