'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Store, MapPin, Wifi, Tv, Car, ChefHat, Shield, Zap,
  BedDouble, Search, Filter, ChevronRight, Star, Users,
  IndianRupee, Phone,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const AMENITY_ICONS: Record<string, any> = {
  WIFI: Wifi, TV: Tv, PARKING: Car, KITCHEN: ChefHat,
  SECURITY: Shield, POWER_BACKUP: Zap,
};

const AMENITY_LABELS: Record<string, string> = {
  WIFI: 'WiFi', TV: 'TV', PARKING: 'Parking', KITCHEN: 'Kitchen',
  SECURITY: 'Security', POWER_BACKUP: 'Power Backup', AC: 'AC',
  LAUNDRY: 'Laundry', GYM: 'Gym',
};

const PROPERTY_TYPES = ['ALL', 'PG', 'HOSTEL', 'FLAT', 'ROOM', 'STUDIO'];
const GENDERS = ['ALL', 'MALE', 'FEMALE', 'MIXED'];

function PropertyCard({ listing }: { listing: any }) {
  const [showContact, setShowContact] = useState(false);

  const GENDER_BADGE: Record<string, string> = {
    MALE: 'bg-blue-100 text-blue-700',
    FEMALE: 'bg-pink-100 text-pink-700',
    MIXED: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="bg-card rounded-2xl border hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden">
      {/* Image or placeholder */}
      <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 relative flex items-center justify-center">
        {listing.propertyId?.images && listing.propertyId.images.length > 0 ? (
          <img
            src={listing.propertyId.images[0]}
            alt={listing.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-white/60 backdrop-blur flex items-center justify-center">
            <BedDouble className="h-8 w-8 text-indigo-400" />
          </div>
        )}
        {listing.gender && (
          <span className={cn(
            'absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full',
            GENDER_BADGE[listing.gender] || 'bg-muted text-foreground'
          )}>
            {listing.gender}
          </span>
        )}
        <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 backdrop-blur text-foreground">
          {listing.propertyType}
        </span>
        {listing.availableBeds > 0 && (
          <span className="absolute bottom-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500 text-white">
            {listing.availableBeds} beds available
          </span>
        )}
      </div>

      <div className="p-5 space-y-3">
        {/* Title & Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground">{listing.name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">{listing.rating ?? 'New'}</span>
            {listing.reviewCount ? <span className="text-xs text-muted-foreground">({listing.reviewCount})</span> : null}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          {listing.propertyId?.address?.city || 'No city info'}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{listing.propertyId?.description || 'No description available for this property.'}</p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(listing.propertyId?.amenities || {})
            .filter(([_, v]) => !!v)
            .map(([k]) => k.toUpperCase())
            .slice(0, 5)
            .map((a: string) => {
              const Icon = AMENITY_ICONS[a];
              return (
                <span key={a} className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  {Icon && <Icon className="h-3 w-3" />}
                  {AMENITY_LABELS[a] ?? a}
                </span>
              );
            })}
          {Object.keys(listing.propertyId?.amenities || {}).filter(k => !!(listing.propertyId?.amenities as any)[k]).length > 5 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{Object.keys(listing.propertyId?.amenities || {}).filter(k => !!(listing.propertyId?.amenities as any)[k]).length - 5} more
            </span>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <span className="text-xs text-muted-foreground">Starting from</span>
            <p className="text-xl font-bold text-foreground flex items-center">
              <IndianRupee className="h-4 w-4" />{(listing.rentMin || 0).toLocaleString('en-IN')}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowContact(!showContact)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                showContact ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-border text-muted-foreground hover:border-indigo-300'
              )}
            >
              <Phone className="h-4 w-4" />
              Contact
            </button>
            <Link href={`/property/${listing.slug || listing._id}`}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs">
                View & Apply <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [gender, setGender] = useState('ALL');
  const [maxRent, setMaxRent] = useState(50000);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['listings', 'public'],
    queryFn: () => apiClient.get('/api/v1/listings/public').then(r => r.data.data),
  });

  const apiListings: any[] = data ?? [];

  const filtered = apiListings.filter(l => {
    if (search && !l.name?.toLowerCase().includes(search.toLowerCase()) && !l.propertyId?.address?.city?.toLowerCase().includes(search.toLowerCase())) return false;
    if (type !== 'ALL' && l.propertyType !== type) return false;
    if (l.rentMin > maxRent) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Store className="h-7 w-7 text-indigo-600" />
          Browse PGs & Rentals
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {filtered.length} properties available across India
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city, or area..."
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
        />
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide flex-1">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
                type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-card text-muted-foreground border-border'
              )}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', showFilters ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-card border-border text-muted-foreground')}
        >
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">GENDER PREFERENCE</label>
            <div className="flex gap-2">
              {GENDERS.map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    gender === g ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border text-muted-foreground'
                  )}
                >
                  {g === 'ALL' ? 'All' : g.charAt(0) + g.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              MAX RENT: ₹{maxRent.toLocaleString('en-IN')}/mo
            </label>
            <input
              type="range" min={3000} max={50000} step={1000}
              value={maxRent} onChange={e => setMaxRent(+e.target.value)}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>₹3,000</span><span>₹50,000</span>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-2xl border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No properties match your filters</p>
          <button onClick={() => { setSearch(''); setType('ALL'); setGender('ALL'); setMaxRent(50000); }} className="text-sm text-indigo-600 mt-2 hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map(listing => <PropertyCard key={listing._id} listing={listing} />)}
        </div>
      )}

      {/* Phase 2 banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
        <p className="text-sm text-indigo-700 font-medium">
          🚀 Full marketplace with real listings, verified landlords, and instant booking coming soon
        </p>
      </div>
    </div>
  );
}
