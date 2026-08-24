import { Injectable, ForbiddenException, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { DocModel, DocumentDocument } from './schemas/document.schema';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocModel.name) private docModel: Model<DocumentDocument>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
    private config: ConfigService,
  ) {}

  async saveDocument(file: Express.Multer.File, userId: string, category: string, relatedTo?: string) {
    return this.docModel.create({
      uploadedBy: new Types.ObjectId(userId),
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      category,
      relatedTo: relatedTo ? new Types.ObjectId(relatedTo) : null,
    });
  }

  /** Returns an authenticated API download URL (never a raw filesystem path). */
  getDownloadUrl(filePath: string): string {
    const baseUrl = this.config.get<string>('appUrl') ?? 'http://localhost:3001';
    const filename = path.basename(filePath);
    return `${baseUrl}/api/v1/documents/download/${encodeURIComponent(filename)}`;
  }

  /**
   * Resolves the absolute disk path for a filename and asserts the requesting
   * user is allowed to read it (owner or landlord of the related tenant).
   */
  async assertDownloadAccess(filename: string, userId: string, role: string): Promise<string> {
    // Build the expected absolute path
    const uploadDir = path.resolve(this.config.get<string>('upload.dir') ?? './uploads');
    // Walk subdirectories to find the file (category sub-folders)
    const absolutePath = await this.resolveUploadPath(uploadDir, filename);
    if (!absolutePath) throw new NotFoundException('File not found');

    if (role === 'SUPER_ADMIN') return absolutePath;

    // Verify a document record exists for this file and the requester owns it
    const doc = await this.docModel.findOne({ filePath: absolutePath, isDeleted: false });
    if (!doc) throw new NotFoundException('File not found');

    const isOwner = doc.uploadedBy.toString() === userId;
    if (isOwner) return absolutePath;

    // Landlord case: they may access documents for their own tenants
    if (doc.relatedTo && doc.relatedModel === 'Tenant') {
      const tenant = await this.tenantModel.findById(doc.relatedTo);
      if (tenant && tenant.landlordId?.toString() === userId) return absolutePath;
    }

    throw new ForbiddenException('You do not have access to this file');
  }

  /** Recursively search for a file by basename under the upload root. */
  private async resolveUploadPath(dir: string, filename: string): Promise<string | null> {
    if (!fs.existsSync(dir)) return null;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = await this.resolveUploadPath(full, filename);
        if (found) return found;
      } else if (entry.name === filename) {
        return full;
      }
    }
    return null;
  }

  async findByUser(userId: string, category?: string) {
    const filter: any = { uploadedBy: new Types.ObjectId(userId), isDeleted: false };
    if (category) filter.category = category;
    return this.docModel.find(filter).sort({ createdAt: -1 });
  }

  async softDelete(id: string, userId: string) {
    return this.docModel.updateOne({ _id: new Types.ObjectId(id), uploadedBy: new Types.ObjectId(userId) }, { isDeleted: true });
  }

  // Verify the tenant belongs to this landlord (admins bypass). Returns the tenant doc.
  private async assertTenantOwnership(tenantId: string, viewerId: string, role: string) {
    if (!Types.ObjectId.isValid(tenantId)) throw new NotFoundException('Tenant not found');
    const tenant = await this.tenantModel.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (role !== 'SUPER_ADMIN' && tenant.landlordId?.toString() !== viewerId)
      throw new ForbiddenException('This tenant does not belong to you');
    return tenant;
  }

  async findByTenant(tenantId: string, viewerId: string, role: string) {
    // Ownership check — a landlord must not read another landlord's tenant's private documents.
    const tenant = await this.assertTenantOwnership(tenantId, viewerId, role);
    const tenantUserId = tenant.userId;

    // Return docs where: (uploaded by tenant) OR (uploaded by landlord for this tenant)
    return this.docModel.find({
      isDeleted: false,
      $or: [
        { uploadedBy: tenantUserId },
        { relatedTo: new Types.ObjectId(tenantId), relatedModel: 'Tenant' },
      ],
    }).sort({ createdAt: -1 });
  }

  async saveLandlordDocForTenant(file: Express.Multer.File, landlordId: string, role: string, tenantId: string, category: string, description?: string) {
    // Landlord may only attach documents to their own tenants.
    await this.assertTenantOwnership(tenantId, landlordId, role);
    return this.docModel.create({
      uploadedBy: new Types.ObjectId(landlordId),
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      category,
      description: description ?? '',
      relatedTo: new Types.ObjectId(tenantId),
      relatedModel: 'Tenant',
    });
  }
}
