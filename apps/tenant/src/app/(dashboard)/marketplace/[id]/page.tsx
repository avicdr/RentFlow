'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Store, MapPin, Wifi, Tv, Car, ChefHat, Shield, Zap, BedDouble, ChevronLeft, IndianRupee, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
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

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => apiClient.get(`/api/v1/listings/public/${id}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  // Guard both the missing listing and an unpopulated property — accessing property.* below
  // would otherwise throw and crash the whole page.
  if (!listing || !listing.propertyId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-foreground">Property not found</h2>
        <p className="text-muted-foreground mt-2">This property might be inactive or no longer exists.</p>
        <Link href="/marketplace">
          <Button variant="outline" className="mt-4">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const property = listing.propertyId;
  const activeRooms = property.rooms?.filter((r: any) => !r.isDeleted && r.capacity > (r.occupiedCount || 0)) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header / Nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/marketplace')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{property.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm mt-0.5">
            <MapPin className="h-4 w-4" />
            {property.address?.line1}, {property.address?.city}, {property.address?.state}
          </p>
        </div>
      </div>

      {/* Hero Image */}
      <div className="h-[400px] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl overflow-hidden relative border shadow-sm">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="h-20 w-20 text-indigo-300" />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Col - Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">About this property</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {property.description || 'No description available for this property.'}
            </p>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(property.amenities || {})
                  .filter(([_, v]) => !!v)
                  .map(([k]) => {
                    const keyStr = k.toUpperCase();
                    const Icon = AMENITY_ICONS[keyStr] || Store;
                    return (
                      <div key={k} className="flex items-center gap-2 text-sm text-foreground bg-muted px-3 py-2 rounded-lg">
                        <Icon className="h-4 w-4 text-indigo-600" />
                        {AMENITY_LABELS[keyStr] ?? keyStr}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">Available Rooms & Pricing</h2>
            {activeRooms.length === 0 ? (
              <p className="text-muted-foreground">No rooms are currently available in this property.</p>
            ) : (
              <div className="space-y-3">
                {activeRooms.map((room: any) => {
                  const availableBeds = room.capacity - (room.occupiedCount || 0);
                  const isSolo = room.type === 'SINGLE';
                  return (
                    <div key={room._id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <BedDouble className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">
                            Room {room.roomNumber} <span className="text-muted-foreground font-normal">· {room.type}</span>
                          </p>
                          <p className="text-xs text-emerald-600 font-medium mt-0.5">
                            {availableBeds} {availableBeds === 1 ? 'bed' : 'beds'} available
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{isSolo ? 'Monthly Rent' : 'Per Bed Rent'}</p>
                        <p className="text-lg font-bold text-foreground flex items-center justify-end">
                          <IndianRupee className="h-4 w-4" />
                          {(room.rentPerBed || room.monthlyRent || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col - Sticky Booking Card */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 shadow-lg sticky top-6">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">Starting from</p>
              <h2 className="text-3xl font-bold text-foreground flex items-center">
                <IndianRupee className="h-6 w-6" />
                {(listing.rentMin || 0).toLocaleString('en-IN')}
                <span className="text-sm font-normal text-muted-foreground ml-1">/mo</span>
              </h2>
            </div>
            
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 text-base shadow-md">
              Request Booking
            </Button>
            <Button variant="outline" className="w-full mt-3 py-6 text-base">
              Schedule a Visit
            </Button>

            <div className="mt-6 pt-6 border-t text-center space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Managed By</p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  L
                </div>
                <p className="font-medium text-foreground">Landlord Verified</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
