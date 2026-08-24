'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/misc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Save, Plus, BedDouble, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { RoomConfigurator, defaultRoomConfig, type RoomConfig } from '@/components/ui/room-configurator';
import { ImageUploader } from '@/components/ui/image-uploader';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  type: z.enum(['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL']),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'MAINTENANCE']),
  address: z.object({
    line1: z.string().min(5, 'Address required'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City required'),
    state: z.string().min(2, 'State required'),
    pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
    country: z.string().default('India'),
  }),
  amenities: z.object({
    wifi: z.boolean().default(false),
    parking: z.boolean().default(false),
    cctv: z.boolean().default(false),
    security: z.boolean().default(false),
    laundry: z.boolean().default(false),
    gym: z.boolean().default(false),
    powerBackup: z.boolean().default(false),
  }).default({}),
  paymentMethods: z.object({
    upiId: z.string().optional(),
    paymentPhone: z.string().optional(),
  }).optional(),
  images: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof schema>;

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi', parking: 'Parking', cctv: 'CCTV', security: '24/7 Security',
  laundry: 'Laundry', gym: 'Gym', powerBackup: 'Power Backup',
};

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => apiClient.get(`/api/v1/properties/${id}`).then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amenities: {}, address: { country: 'India' }, status: 'ACTIVE', images: [] },
  });

  // Populate form when data loads
  useEffect(() => {
    if (property) {
      reset({
        name: property.name ?? '',
        type: property.type ?? 'APARTMENT',
        description: property.description ?? '',
        status: property.status ?? 'ACTIVE',
        address: {
          line1: property.address?.line1 ?? property.address?.street ?? '',
          line2: property.address?.line2 ?? '',
          city: property.address?.city ?? '',
          state: property.address?.state ?? '',
          pincode: property.address?.pincode ?? '',
          country: property.address?.country ?? 'India',
        },
        amenities: {
          wifi: property.amenities?.wifi ?? (property.amenities?.includes?.('WiFi') || false),
          parking: property.amenities?.parking ?? (property.amenities?.includes?.('Parking') || false),
          cctv: property.amenities?.cctv ?? false,
          security: property.amenities?.security ?? false,
          laundry: property.amenities?.laundry ?? false,
          gym: property.amenities?.gym ?? false,
          powerBackup: property.amenities?.powerBackup ?? (property.amenities?.includes?.('Power Backup') || false),
        },
        paymentMethods: {
          upiId: property.paymentMethods?.upiId ?? '',
          paymentPhone: property.paymentMethods?.paymentPhone ?? '',
        },
        images: property.images ?? [],
      });
    }
  }, [property, reset]);

  const amenities = watch('amenities');
  const images = watch('images');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState<RoomConfig>(defaultRoomConfig());

  const { data: roomsData, refetch: refetchRooms } = useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/rooms?propertyId=${id}`);
      // Sync property counters every time rooms load
      apiClient.get(`/api/v1/rooms/sync/${id}`).catch(() => {});
      return res.data.data;
    },
    enabled: !!id,
  });

  const { mutate: addRoom, isPending: addingRoom } = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/rooms', data),
    onSuccess: () => { refetchRooms(); setShowAddRoom(false); setNewRoom(defaultRoomConfig()); },
  });

  const { mutate: deleteRoom } = useMutation({
    mutationFn: (roomId: string) => apiClient.delete(`/api/v1/rooms/${roomId}`),
    onSuccess: () => refetchRooms(),
  });

  const { mutate: update, isPending } = useMutation({
    mutationFn: (data: FormData) => apiClient.patch(`/api/v1/properties/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['property', id] });
      setFeedback({ type: 'success', msg: 'Property updated successfully!' });
      setTimeout(() => router.push(`/properties/${id}`), 800);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', msg: err.response?.data?.message ?? 'Failed to update property.' });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/properties/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Property</h1>
          <p className="text-muted-foreground text-sm">{property?.name}</p>
        </div>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => update(d))} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input placeholder="e.g. Sunshine PG Koramangala" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('type')}>
                  {['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea placeholder="Describe your property..." {...register('description')} />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Address Line 1</Label>
              <Input placeholder="Street address" {...register('address.line1')} />
              {errors.address?.line1 && <p className="text-xs text-red-500">{errors.address.line1.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Address Line 2 (optional)</Label>
              <Input placeholder="Landmark, area..." {...register('address.line2')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="Bengaluru" {...register('address.city')} />
                {errors.address?.city && <p className="text-xs text-red-500">{errors.address.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="Karnataka" {...register('address.state')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input placeholder="560034" maxLength={6} {...register('address.pincode')} />
              {errors.address?.pincode && <p className="text-xs text-red-500">{errors.address.pincode.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(amenityLabels).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-indigo-600"
                    checked={!!(amenities as any)?.[key]}
                    onChange={(e) => setValue(`amenities.${key}` as `amenities.${keyof FormData['amenities']}`, e.target.checked)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Property Images */}
        <Card>
          <CardHeader><CardTitle>Property Images</CardTitle></CardHeader>
          <CardContent>
            <ImageUploader
              value={images}
              onChange={(urls) => setValue('images', urls, { shouldValidate: true })}
            />
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input placeholder="e.g. landlord@upi" {...register('paymentMethods.upiId')} />
            </div>
            <div className="space-y-2">
              <Label>Payment Phone Number</Label>
              <Input placeholder="e.g. 9876543210" {...register('paymentMethods.paymentPhone')} />
            </div>
          </CardContent>
        </Card>

        {/* Rooms Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><BedDouble className="h-5 w-5" />Rooms & Beds</CardTitle>
            <Button
              type="button"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 gap-1"
              onClick={() => setShowAddRoom(v => !v)}
            >
              <Plus className="h-4 w-4" />{showAddRoom ? 'Cancel' : 'Add Room'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add room form */}
            {showAddRoom && (
              <div className="border rounded-xl p-4 bg-muted/50 space-y-4">
                <RoomConfigurator value={newRoom} onChange={setNewRoom} />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddRoom(false)}>Cancel</Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 gap-1"
                    disabled={addingRoom}
                    onClick={() => addRoom({
                      floor: newRoom.floor,
                      type: newRoom.type,
                      capacity: newRoom.capacity,
                      monthlyRent: newRoom.monthlyRent,
                      rentPerBed: newRoom.rentPerBed,
                      description: newRoom.description,
                      count: 1,
                      propertyId: id,
                    })}
                  >
                    {addingRoom ? <><Loader2 className="h-4 w-4 animate-spin" />Adding...</> : <><Plus className="h-4 w-4" />Add Room</>}
                  </Button>
                </div>
              </div>
            )}

            {/* Existing rooms */}
            {(!roomsData || roomsData.length === 0) && !showAddRoom && (
              <p className="text-sm text-muted-foreground text-center py-6">No rooms yet — add your first room above.</p>
            )}
            <div className="space-y-2">
              {(roomsData ?? []).map((room: any) => {
                const occupied = room.beds?.filter((b: any) => b.status === 'OCCUPIED').length ?? 0;
                const total = room.beds?.length ?? room.capacity ?? 0;
                const sharingLabel: Record<string, string> = {
                  SINGLE: 'Solo', DOUBLE: 'Double Sharing', TRIPLE: 'Triple Sharing',
                  QUAD: 'Quad Sharing', DORMITORY: 'Dormitory', STUDIO: 'Studio',
                };
                return (
                  <div key={room._id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <BedDouble className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Room {room.roomNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {sharingLabel[room.type] ?? room.type} · {occupied}/{total} beds · ₹{(room.monthlyRent ?? 0).toLocaleString('en-IN')}/mo
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { if (confirm('Delete this room?')) deleteRoom(room._id); }}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Total beds summary */}
            {roomsData && roomsData.length > 0 && (
              <div className="pt-2 border-t text-sm text-muted-foreground flex gap-6">
                <span><strong className="text-foreground">{roomsData.length}</strong> rooms</span>
                <span><strong className="text-foreground">{roomsData.reduce((a: number, r: any) => a + (r.capacity ?? 0), 0)}</strong> total beds</span>
                <span><strong className="text-foreground">₹{roomsData.reduce((a: number, r: any) => a + (r.monthlyRent ?? 0), 0).toLocaleString('en-IN')}</strong>/mo capacity</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : <><Save className="h-4 w-4" />Save Changes</>}
          </Button>
          <Link href={`/properties/${id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
