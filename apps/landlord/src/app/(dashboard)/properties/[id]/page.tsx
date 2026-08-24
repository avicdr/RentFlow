'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Users, Bed, Settings, Edit, Building2,
  CreditCard, CheckCircle, XCircle, Clock, Eye,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Skeleton } from '@/components/ui/misc';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => apiClient.get(`/api/v1/properties/${id}`).then(r => r.data.data),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['property-tenants', id],
    queryFn: () => apiClient.get(`/api/v1/properties/${id}/tenants`).then(r => r.data.data),
  });

  const { data: roomsData } = useQuery({
    queryKey: ['property-rooms', id],
    queryFn: () => apiClient.get(`/api/v1/properties/${id}/rooms`).then(r => r.data.data),
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>;
  }

  const property = data;
  if (!property) return <div className="text-center py-16 text-muted-foreground">Property not found</div>;

  const occupancyPct = property.totalBeds > 0
    ? Math.round((property.occupiedBeds / property.totalBeds) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/properties">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{property.name}</h1>
            <Badge variant={property.status === 'ACTIVE' ? 'success' : 'secondary'}>{property.status}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {property.address?.line1}, {property.address?.city}, {property.address?.state} — {property.address?.pincode}
          </div>
        </div>
        <Link href={`/properties/${id}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" /> Edit
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Occupancy</p>
            <p className="text-3xl font-bold mt-1">{occupancyPct}%</p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${occupancyPct}%`, backgroundColor: occupancyPct > 80 ? '#16a34a' : occupancyPct > 50 ? '#ca8a04' : '#dc2626' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{property.occupiedBeds}/{property.totalBeds} beds filled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Rooms</p>
            <p className="text-3xl font-bold mt-1">{property.totalRooms}</p>
            <p className="text-xs text-muted-foreground mt-1">{property.totalBeds} total beds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Active Tenants</p>
            <p className="text-3xl font-bold mt-1">{tenantsData?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{property.type}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rooms</CardTitle>
          <Link href={`/properties/${id}/rooms/new`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Add Room</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(roomsData ?? []).map((room: any) => (
              <div key={room._id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Room {room.roomNumber}</span>
                  <Badge variant={room.status === 'AVAILABLE' ? 'success' : room.status === 'FULLY_OCCUPIED' ? 'destructive' : 'warning'}>
                    {room.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{room.type} · {room.occupiedCount}/{room.capacity} beds</p>
                <p className="text-sm font-medium mt-2">{formatCurrency(room.monthlyRent)}/mo</p>
              </div>
            ))}
            {(roomsData ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No rooms added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tenants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tenants</CardTitle>
          <Link href={`/tenants/new?propertyId=${id}`}>
            <Button size="sm" variant="outline">Add Tenant</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {(tenantsData ?? []).map((t: any) => (
              <div key={t._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                    {t.userId?.firstName?.[0]}{t.userId?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.userId?.firstName} {t.userId?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(t.agreedRent)}/mo · Due day {t.rentDueDay}</p>
                  </div>
                </div>
                <Link href={`/tenants/${t._id}`}>
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </Link>
              </div>
            ))}
            {(tenantsData ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No tenants assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      {property.paymentMethods && (
        <Card>
          <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {property.paymentMethods.upiId && <p><span className="font-medium">UPI ID:</span> {property.paymentMethods.upiId}</p>}
            {property.paymentMethods.paymentPhone && <p><span className="font-medium">Phone:</span> {property.paymentMethods.paymentPhone}</p>}
            {property.paymentMethods.bankAccount && (
              <div>
                <p className="font-medium">Bank Account</p>
                <p className="text-muted-foreground">
                  {property.paymentMethods.bankAccount.bankName} · {property.paymentMethods.bankAccount.accountNumber} · IFSC: {property.paymentMethods.bankAccount.ifsc}
                </p>
              </div>
            )}
            {property.paymentMethods.instructions && (
              <p className="text-muted-foreground">{property.paymentMethods.instructions}</p>
            )}
            <Link href={`/properties/${id}/edit?tab=payment`}>
              <Button variant="outline" size="sm" className="mt-2">Edit Payment Methods</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
