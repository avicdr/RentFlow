'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Save, Loader2, ArrowLeft } from 'lucide-react';
import apiClient from '@/lib/api-client';
import Link from 'next/link';

function AddTenantForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId') || '';
  const qc = useQueryClient();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    propertyId: propertyId, roomId: '', bedId: '',
    agreedRent: '', securityDeposit: '', joiningDate: new Date().toISOString().split('T')[0],
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.get('/api/v1/properties').then(r => r.data.data),
  });

  const { data: propertyDetails } = useQuery({
    queryKey: ['properties', form.propertyId],
    queryFn: () => apiClient.get(`/api/v1/properties/${form.propertyId}`).then(r => r.data.data),
    enabled: !!form.propertyId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/tenants', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      router.push('/tenants');
    },
  });

  const rooms = propertyDetails?.rooms || [];
  const selectedRoom = rooms.find((r: any) => r._id === form.roomId);
  const beds = selectedRoom?.beds || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tenants" className="p-2 hover:bg-muted rounded-lg transition-colors"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboard New Tenant</h1>
          <p className="text-muted-foreground text-sm mt-1">Add a tenant to a property and assign a bed</p>
        </div>
      </div>

      <form onSubmit={e => {
        e.preventDefault();
        mutate({
          ...form,
          agreedRent: Number(form.agreedRent),
          securityDeposit: Number(form.securityDeposit),
        });
      }} className="space-y-6 bg-card rounded-xl border p-6">
        
        {/* Personal Details */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" /> Personal Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">First Name</label>
              <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Last Name</label>
              <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Phone</label>
              <input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Accommodation */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b pb-2">Accommodation & Lease</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Property</label>
              <select required value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value, roomId: '', bedId: '' }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-card">
                <option value="">Select Property...</option>
                {properties?.map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Room</label>
              <select required disabled={!form.propertyId} value={form.roomId} onChange={e => setForm(f => ({ ...f, roomId: e.target.value, bedId: '' }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-card disabled:bg-muted">
                <option value="">Select Room...</option>
                {rooms.map((r: any) => <option key={r._id} value={r._id}>Room {r.roomNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Bed</label>
              <select required disabled={!form.roomId} value={form.bedId} onChange={e => setForm(f => ({ ...f, bedId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-card disabled:bg-muted">
                <option value="">Select Bed...</option>
                {beds.map((b: any) => <option key={b._id} value={b._id} disabled={b.status !== 'AVAILABLE'}>Bed {b.bedIdentifier} {b.status !== 'AVAILABLE' && '(Taken)'}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Agreed Rent (₹)</label>
              <input type="number" required value={form.agreedRent} onChange={e => setForm(f => ({ ...f, agreedRent: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Security Deposit (₹)</label>
              <input type="number" required value={form.securityDeposit} onChange={e => setForm(f => ({ ...f, securityDeposit: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Joining Date</label>
              <input type="date" required value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link href="/tenants" className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</Link>
          <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Create Tenant
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AddTenantPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>}>
      <AddTenantForm />
    </Suspense>
  );
}
