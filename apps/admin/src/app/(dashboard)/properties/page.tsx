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
        <h1 className="text-2xl font-bold text-white">All Properties</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide property registry</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Property</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400 hidden md:table-cell">Landlord</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400 hidden lg:table-cell">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Rooms</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-600">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No properties found</p>
              </td></tr>
            ) : (
              filtered.map((p: any) => (
                <tr key={p._id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {[p.address?.line1, p.address?.city].filter(Boolean).join(', ') || p.address?.city || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-300 text-sm">
                      {p.landlordId?.firstName
                        ? `${p.landlordId.firstName} ${p.landlordId.lastName ?? ''}`.trim()
                        : p.landlordId?.email ?? <span className="text-gray-600">—</span>}
                    </p>
                    {p.landlordId?.email && p.landlordId?.firstName && (
                      <p className="text-xs text-gray-600">{p.landlordId.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">{p.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-300">
                      <Users className="h-3.5 w-3.5" />
                      {p.occupiedBeds ?? 0}/{p.totalBeds ?? 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{p.totalRooms ?? 0} rooms</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'ACTIVE' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-400'
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
