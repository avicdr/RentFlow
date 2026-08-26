'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Search, Phone, Mail, Home, IndianRupee, ChevronRight, Building2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import Link from 'next/link';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => apiClient.get('/api/v1/properties').then(r => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', { propertyId, status, paymentStatus }],
    queryFn: () => apiClient.get('/api/v1/tenants', {
      params: {
        propertyId: propertyId || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        limit: 50,
      }
    }).then(r => r.data.data),
  });

  const properties: any[] = propertiesData ?? [];
  const tenants: any[] = (data ?? []).filter((t: any) => {
    if (!search) return true;
    const target = `${t.userId?.firstName ?? ''} ${t.userId?.lastName ?? ''} ${t.userId?.email ?? ''} ${t.userId?.phone ?? ''} ${t.roomId?.roomNumber ?? ''} ${t.roomId?.type ?? ''} ${t.propertyId?.name ?? ''}`;
    return target.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.length ?? 0} tenant{(data?.length ?? 0) !== 1 ? 's' : ''} across your properties
          </p>
        </div>
        <Link
          href="/tenants/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Tenant
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, room no, or property..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-muted"
          />
        </div>
        <select
          value={propertyId}
          onChange={e => setPropertyId(e.target.value)}
          className="h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-muted min-w-[160px]"
        >
          <option value="">All Properties</option>
          {properties.map((p: any) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-muted"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="VACATED">Vacated</option>
        </select>
        <select
          value={paymentStatus}
          onChange={e => setPaymentStatus(e.target.value)}
          className="h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-muted"
        >
          <option value="">All Payments</option>
          <option value="PAID">Paid This Month</option>
          <option value="UNPAID">Unpaid This Month</option>
          <option value="PENDING">Pending Review</option>
        </select>
      </div>

      {/* Tenant Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-card rounded-2xl border animate-pulse" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="font-semibold text-muted-foreground">No tenants found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new tenant</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((t: any) => {
            const initials = `${t.userId?.firstName?.[0] ?? ''}${t.userId?.lastName?.[0] ?? ''}`.toUpperCase();
            return (
              <div key={t._id} className="bg-card rounded-2xl border hover:shadow-md transition-all duration-200 group overflow-hidden">
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {initials || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {t.userId?.firstName ?? 'Unknown'} {t.userId?.lastName ?? ''}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{t.userId?.email ?? ''}</p>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      t.status === 'VACATED' ? 'bg-muted text-muted-foreground' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {t.status ?? 'ACTIVE'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    {t.userId?.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{t.userId.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{t.propertyId?.name ?? '—'}</span>
                    </div>
                    {t.roomId && (
                      <div className="flex items-center gap-2 text-xs">
                        <Home className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                          {t.roomId?.type?.replace('_', ' ')} · Room {t.roomId?.roomNumber ?? '—'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-foreground font-semibold">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      <span>₹{(t.agreedRent ?? 0).toLocaleString('en-IN')}/month</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t bg-muted flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    t.currentMonthPaymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    t.currentMonthPaymentStatus === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t.currentMonthPaymentStatus === 'PAID' ? '✓ Paid this month' :
                     t.currentMonthPaymentStatus === 'PENDING' ? '⏳ Payment pending' :
                     '✗ Unpaid this month'}
                  </span>
                  <Link
                    href={`/tenants/${t._id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
