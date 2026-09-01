'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Users, Bed, Settings, Edit, Building2,
  CreditCard, CheckCircle, XCircle, Clock, Eye, Globe, Share2,
  Calendar, Check, Copy, MessageCircle, X, ShieldCheck,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Skeleton } from '@/components/ui/misc';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

function ShareModal({ property, onClose }: { property: any; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin.replace('3000', '3002')}/property/${property.slug || property._id}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Check out ${property.name} on RentFlow!\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-foreground">Share Public Listing</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <p className="text-sm text-muted-foreground">
          Send this direct link to prospective tenants to view room availability and apply online.
        </p>

        <div className="flex items-center gap-2 bg-muted/60 p-2.5 rounded-xl border border-border">
          <input
            readOnly
            value={shareUrl}
            className="bg-transparent text-xs text-foreground flex-1 outline-none font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
          </button>
        </div>

        <button
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs"
        >
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </button>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);

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

  const { mutate: publish, isPending: isPublishing } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/properties/${id}/publish`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      toast({ title: 'Property Published', description: 'Your listing is now live and discoverable on RentFlow.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Cannot Publish',
        description: err?.response?.data?.message || 'Failed to publish property',
        variant: 'destructive',
      });
    },
  });

  const { mutate: unpublish, isPending: isUnpublishing } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/properties/${id}/unpublish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      toast({ title: 'Property Unpublished', description: 'Your listing is now private.' });
    },
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>;
  }

  const property = data;
  if (!property) return <div className="text-center py-16 text-muted-foreground">Property not found</div>;

  const isPublished = property.listingStatus === 'PUBLISHED';
  const occupancyPct = property.totalBeds > 0
    ? Math.round((property.occupiedBeds / property.totalBeds) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Publishing Status Banner */}
      <div className={cn(
        'rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs',
        isPublished
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', isPublished ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400')}>
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">
                {isPublished ? 'Live on RentFlow Marketplace' : 'Draft / Unpublished Listing'}
              </span>
              <span className={cn('text-[11px] px-2 py-0.5 rounded-full font-bold uppercase', isPublished ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white')}>
                {property.listingStatus || 'DRAFT'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPublished
                ? `Public URL: /property/${property.slug || property._id}`
                : 'Publish to make this property discoverable by prospective tenants.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isPublished && (
            <Button size="sm" variant="outline" onClick={() => setShareOpen(true)} className="gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5 text-indigo-500" /> Share Page
            </Button>
          )}

          {isPublished ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isUnpublishing}
              onClick={() => unpublish()}
              className="text-xs text-muted-foreground hover:text-red-600"
            >
              {isUnpublishing ? 'Unpublishing...' : 'Unpublish'}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isPublishing}
              onClick={() => publish()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
            >
              {isPublishing ? 'Publishing...' : 'Publish to Marketplace'}
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/properties">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate text-foreground">{property.name}</h1>
            <Badge variant={property.status === 'ACTIVE' ? 'success' : 'secondary'}>{property.status}</Badge>
            {property.isVerified && <Badge variant="success">Verified</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-indigo-500" />
            {property.address?.line1}, {property.address?.city}, {property.address?.state} — {property.address?.pincode}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/properties/${id}/availability`}>
            <Button variant="outline" size="sm" className="gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-4 w-4" /> Availability Calendar
            </Button>
          </Link>
          <Link href={`/properties/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl shadow-xs">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
            <p className="text-3xl font-bold text-foreground mt-1">{occupancyPct}%</p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-emerald-500"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{property.occupiedBeds}/{property.totalBeds} beds filled</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-xs">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
            <p className="text-3xl font-bold text-foreground mt-1">{property.totalRooms}</p>
            <p className="text-xs text-muted-foreground mt-1">{property.totalBeds} total beds</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-xs">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
            <p className="text-3xl font-bold text-foreground mt-1">{tenantsData?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{property.type}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms with Availability indicator */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Rooms & Units</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Manage individual room pricing and availability</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/properties/${id}/availability`}>
              <Button size="sm" variant="outline" className="text-xs gap-1">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Availability View
              </Button>
            </Link>
            <Link href={`/properties/${id}/rooms/new`}>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Add Room</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(roomsData ?? []).map((room: any) => (
              <div key={room._id} className="p-4 border rounded-xl bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Room {room.roomNumber}</span>
                  <Badge variant={room.status === 'AVAILABLE' ? 'success' : room.status === 'MAINTENANCE' ? 'destructive' : 'warning'}>
                    {room.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{room.type} · Floor {room.floor || 'G'} · {room.occupiedCount}/{room.capacity} beds</p>
                <div className="flex items-baseline justify-between pt-1 border-t border-border">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(room.monthlyRent || room.rentPerBed)}/mo</p>
                  {room.deposit > 0 && <p className="text-xs text-muted-foreground">Deposit: ₹{room.deposit}</p>}
                </div>
              </div>
            ))}
            {(roomsData ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No rooms added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Property Managers */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" /> Property Managers
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Managers assigned to oversee this specific property</p>
          </div>
          <Link href="/property-managers">
            <Button size="sm" variant="outline" className="text-xs gap-1.5 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
              <Users className="h-3.5 w-3.5" /> Manage Team
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <PropertyManagersList propertyId={id} />
        </CardContent>
      </Card>

      {/* Tenants */}
      <Card className="rounded-2xl shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current Tenants</CardTitle>
          <Link href={`/tenants/new?propertyId=${id}`}>
            <Button size="sm" variant="outline">Add Tenant</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {(tenantsData ?? []).map((t: any) => (
              <div key={t._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {t.userId?.firstName?.[0]}{t.userId?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.userId?.firstName} {t.userId?.lastName}</p>
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

      {shareOpen && <ShareModal property={property} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

function PropertyManagersList({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: managersRes, isLoading } = useQuery({
    queryKey: ['property-assigned-managers', propertyId],
    queryFn: () => apiClient.get(`/api/v1/property-managers/properties/${propertyId}/managers`).then(r => r.data.data),
  });

  const { mutate: removeManager } = useMutation({
    mutationFn: (managerId: string) => apiClient.delete(`/api/v1/property-managers/${managerId}/properties/${propertyId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property-assigned-managers', propertyId] });
      toast({ title: 'Manager Removed', description: 'Manager has been unassigned from this property.' });
    },
  });

  const managers: any[] = managersRes || [];

  if (isLoading) {
    return <div className="h-16 bg-muted rounded-xl animate-pulse" />;
  }

  if (managers.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground space-y-2">
        <p>No property managers assigned to this property yet.</p>
        <Link href="/property-managers" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
          + Assign or Invite a Property Manager
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {managers.map((item) => {
        const m = item.manager || {};
        return (
          <div key={item.assignmentId} className="flex items-center justify-between py-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300">
                {m.firstName?.[0]}{m.lastName?.[0]}
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{m.firstName} {m.lastName}</p>
                <p className="text-muted-foreground text-[11px]">{m.email} {m.phone ? `· ${m.phone}` : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                {item.status}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeManager(m._id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 px-2"
                title="Unassign from this property"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

