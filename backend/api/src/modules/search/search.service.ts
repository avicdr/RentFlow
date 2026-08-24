import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

export interface SearchResult {
  type: 'property' | 'tenant' | 'user' | 'payment';
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel('Property') private propertyModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Payment') private paymentModel: Model<any>,
    @InjectModel('Tenant') private tenantModel: Model<any>,
  ) {}

  private escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // The set of tenant User ids that belong to a given landlord — used to scope tenant search
  // so a landlord can't enumerate every tenant on the platform.
  private async landlordTenantUserIds(landlordId: string): Promise<Types.ObjectId[]> {
    const tenants = await this.tenantModel
      .find({ landlordId: new Types.ObjectId(landlordId), isDeleted: false })
      .select('userId');
    return tenants.map((t: any) => t.userId).filter(Boolean);
  }

  async globalSearch(q: string, userId: string, role: string): Promise<SearchResult[]> {
    if (!q || q.length < 2) return [];
    const regex = new RegExp(this.escapeRegex(q), 'i');
    const results: SearchResult[] = [];
    const isAdmin = role === 'SUPER_ADMIN';

    // Properties
    const propFilter: any = { isDeleted: false, $or: [{ name: regex }, { 'address.city': regex }, { 'address.area': regex }] };
    if (!isAdmin) propFilter.landlordId = userId;
    const props = await this.propertyModel.find(propFilter).limit(5).select('name address type status');
    props.forEach(p => results.push({
      type: 'property', id: p._id.toString(),
      title: p.name, subtitle: p.address?.city ?? '',
      meta: p.type, href: `/properties/${p._id}`,
    }));

    // Users / Tenants
    const userFilter: any = {
      isDeleted: false,
      $or: [
        { email: regex },
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
      ],
    };
    if (!isAdmin) {
      // Restrict to THIS landlord's tenants, not every tenant on the platform.
      userFilter.role = 'TENANT';
      userFilter._id = { $in: await this.landlordTenantUserIds(userId) };
    }
    const users = await this.userModel.find(userFilter).limit(5).select('firstName lastName email role');
    users.forEach(u => results.push({
      type: 'user', id: u._id.toString(),
      title: `${u.firstName} ${u.lastName}`, subtitle: u.email,
      meta: u.role, href: isAdmin ? `/users` : `/tenants`,
    }));

    // Payments by UTR
    if (q.length >= 6) {
      const paymentFilter: any = { 'submission.utrNumber': regex };
      if (!isAdmin) paymentFilter.landlordId = userId;
      const pays = await this.paymentModel.find(paymentFilter).limit(3).select('amount month year status submission');
      pays.forEach(p => results.push({
        type: 'payment', id: p._id.toString(),
        title: `₹${p.amount.toLocaleString('en-IN')} — ${p.status}`,
        subtitle: `UTR: ${p.submission?.utrNumber}`,
        meta: `${p.month}/${p.year}`,
        href: `/payments/${p._id}`,
      }));
    }

    return results;
  }

  async propertySearch(q: string, landlordId: string, filters: any = {}) {
    const regex = new RegExp(this.escapeRegex(q || ''), 'i');
    const filter: any = { landlordId, isDeleted: false };
    if (q) filter.$or = [{ name: regex }, { 'address.city': regex }, { 'address.area': regex }];
    if (filters.status) filter.status = filters.status;
    if (filters.type) filter.type = filters.type;
    return this.propertyModel.find(filter).limit(20).select('name type status address occupancy');
  }

  async tenantSearch(q: string, landlordId: string) {
    const regex = new RegExp(this.escapeRegex(q || ''), 'i');
    // Scope to the landlord's own tenants only — prevents platform-wide tenant PII enumeration.
    const tenantUserIds = await this.landlordTenantUserIds(landlordId);
    return this.userModel.find({
      _id: { $in: tenantUserIds },
      role: 'TENANT',
      isDeleted: false,
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }],
    }).limit(20).select('firstName lastName email phone isEmailVerified');
  }

  async adminUserSearch(q: string, filters: any = {}) {
    const regex = new RegExp(this.escapeRegex(q || ''), 'i');
    const filter: any = { isDeleted: false };
    if (q) filter.$or = [{ email: regex }, { firstName: regex }, { lastName: regex }];
    if (filters.role) filter.role = filters.role;
    if (filters.status) filter.status = filters.status;
    return this.userModel.find(filter).limit(25).select('firstName lastName email role status isEmailVerified isKycVerified createdAt');
  }
}
