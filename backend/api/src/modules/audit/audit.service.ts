import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>) {}

  async log(
    performedBy: string,
    action: string,
    resource: string,
    resourceId?: string,
    before?: Record<string, unknown>,
    after?: Record<string, unknown>,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO',
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      await this.auditModel.create({
        performedBy: new Types.ObjectId(performedBy),
        action, resource,
        resourceId: resourceId ? new Types.ObjectId(resourceId) : undefined,
        before, after, severity, metadata: metadata ?? {},
      });
    } catch (_) { /* Non-blocking — never fail business logic for audit */ }
  }

  async findAll(filters: { resource?: string; performedBy?: string; action?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const query: any = {};
    if (filters.resource) query.resource = filters.resource;
    if (filters.performedBy) query.performedBy = new Types.ObjectId(filters.performedBy);
    if (filters.action) query.action = filters.action;

    const [logs, total] = await Promise.all([
      this.auditModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('performedBy', 'firstName lastName email role'),
      this.auditModel.countDocuments(query),
    ]);

    return { data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
