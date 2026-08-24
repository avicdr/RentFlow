'use client';

import { useQuery } from '@tanstack/react-query';
import { Store, MapPin, BedDouble, IndianRupee } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ListingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: () => apiClient.get('/api/v1/listings').then(r => r.data.data),
  });

  const listings: any[] = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketplace Listings</h1>
        <p className="text-muted-foreground text-sm mt-1">Properties are automatically listed here when they have available beds.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border">
          <Store className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground font-semibold">No active listings</p>
          <p className="text-sm text-muted-foreground mt-1">Add rooms to your properties and they will automatically appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((l: any) => (
            <div key={l._id} className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                {l.propertyId?.images && l.propertyId.images.length > 0 ? (
                  <img src={l.propertyId.images[0]} alt={l.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="h-10 w-10 text-indigo-400 relative z-10" />
                )}
                <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 backdrop-blur">
                  AUTO-LISTED
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground truncate">{l.propertyId?.name ?? l.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {l.propertyId?.address?.city ?? '—'}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {(l.rentMin ?? 0).toLocaleString('en-IN')}/mo
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <BedDouble className="h-4 w-4" />
                    {l.availableBeds ?? 0} beds available
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
