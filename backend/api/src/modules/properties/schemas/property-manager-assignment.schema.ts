import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyManagerAssignmentDocument = PropertyManagerAssignment & Document;

export enum ManagerAssignmentStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
}

@Schema({ _id: false })
export class ManagerPermissions {
  // Tenant permissions
  @Prop({ default: true }) viewTenants: boolean;
  @Prop({ default: true }) manageTenants: boolean;

  // Room permissions
  @Prop({ default: true }) viewRooms: boolean;
  @Prop({ default: true }) manageRooms: boolean;

  // Payment permissions
  @Prop({ default: true }) viewPayments: boolean;
  @Prop({ default: true }) recordPayments: boolean;

  // Maintenance & Complaints permissions
  @Prop({ default: true }) viewMaintenance: boolean;
  @Prop({ default: true }) manageMaintenance: boolean;

  // Document permissions
  @Prop({ default: true }) viewDocuments: boolean;
  @Prop({ default: true }) uploadDocuments: boolean;

  // Property details permissions
  @Prop({ default: true }) viewProperty: boolean;
  @Prop({ default: false }) editProperty: boolean;
  @Prop({ default: false }) deleteProperty: boolean;

  // Property settings
  @Prop({ default: false }) manageSettings: boolean;
}

export const ManagerPermissionsSchema = SchemaFactory.createForClass(ManagerPermissions);

@Schema({ timestamps: true, collection: 'property_manager_assignments' })
export class PropertyManagerAssignment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property', index: true })
  propertyId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  landlordId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ManagerAssignmentStatus),
    default: ManagerAssignmentStatus.ACTIVE,
    index: true,
  })
  status: ManagerAssignmentStatus;

  @Prop({ type: ManagerPermissionsSchema, default: () => ({}) })
  permissions: ManagerPermissions;

  @Prop({ type: String, select: false })
  inviteToken?: string;

  @Prop({ type: Date })
  inviteExpiresAt?: Date;

  @Prop({ type: Date, default: Date.now })
  invitedAt: Date;

  @Prop({ type: Date })
  acceptedAt?: Date;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const PropertyManagerAssignmentSchema = SchemaFactory.createForClass(PropertyManagerAssignment);

// Compound unique index ensuring a manager cannot be assigned to the same property twice while active/not deleted
PropertyManagerAssignmentSchema.index(
  { userId: 1, propertyId: 1, isDeleted: 1 },
  { unique: true },
);
