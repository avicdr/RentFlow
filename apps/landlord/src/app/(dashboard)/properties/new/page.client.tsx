'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/misc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  type: z.enum(['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL']),
  description: z.string().optional(),
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
});

type FormData = z.infer<typeof schema>;

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi', parking: 'Parking', cctv: 'CCTV', security: '24/7 Security',
  laundry: 'Laundry', gym: 'Gym', powerBackup: 'Power Backup',
};

export default function NewPropertyPageClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amenities: {}, address: { country: 'India' } },
  });

  const amenities = watch('amenities');

  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: FormData) => apiClient.post('/api/v1/properties', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      toast({ title: '✅ Property created successfully' });
      router.push(`/properties/${res.data.data._id}`);
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create', description: err.response?.data?.message, variant: 'destructive' });
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/properties">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Property</h1>
          <p className="text-muted-foreground text-sm">Create a new property listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => create(d))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input placeholder="e.g. Sunshine PG Koramangala" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Property Type</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('type')}>
                {['PG', 'APARTMENT', 'VILLA', 'COMMERCIAL', 'HOSTEL'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea placeholder="Describe your property..." {...register('description')} />
            </div>
          </CardContent>
        </Card>

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

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Property'}
          </Button>
          <Link href="/properties">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
