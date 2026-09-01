'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, MapPin, Users } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AdminPropertiesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'properties'],
    queryFn: () => apiClient.get('/api/v1/admin/properties').then(r => r.data.data),
  });

  const properties: any[] = data ?? [];
  const filtered = properties.filter((p: any) =>
    `${p.name} ${p.address?.city} ${p.address?.area}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Properties</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide property registry</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search properties by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Property</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Landlord</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rooms</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No properties found</p>
              </td></tr>
            ) : (
              filtered.map((p: any) => (
                <tr key={p._id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-indigo-500" />
                      {[p.address?.line1, p.address?.city].filter(Boolean).join(', ') || p.address?.city || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-foreground text-sm font-medium">
                      {p.landlordId?.firstName
                        ? `${p.landlordId.firstName} ${p.landlordId.lastName ?? ''}`.trim()
                        : p.landlordId?.email ?? <span className="text-muted-foreground">—</span>}
                    </p>
                    {p.landlordId?.email && p.landlordId?.firstName && (
                      <p className="text-xs text-muted-foreground">{p.landlordId.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground border border-border">{p.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-foreground font-medium">
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      {p.occupiedBeds ?? 0}/{p.totalBeds ?? 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.totalRooms ?? 0} rooms</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
