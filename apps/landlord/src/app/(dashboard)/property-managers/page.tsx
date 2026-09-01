'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, UserPlus, Users, Building2, Search, MoreVertical,
  CheckCircle2, XCircle, AlertCircle, Trash2, Mail, Phone,
  ChevronRight, Lock, KeyRound, Sparkles, RefreshCw, SlidersHorizontal,
  Check, X,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn, formatDateShort } from '@/lib/utils';

interface PermissionState {
  viewTenants: boolean;
  manageTenants: boolean;
  viewRooms: boolean;
  manageRooms: boolean;
  viewPayments: boolean;
  recordPayments: boolean;
  viewMaintenance: boolean;
  manageMaintenance: boolean;
  viewDocuments: boolean;
  uploadDocuments: boolean;
  viewProperty: boolean;
  editProperty: boolean;
  deleteProperty: boolean;
  manageSettings: boolean;
}

const DEFAULT_PERMISSIONS: PermissionState = {
  viewTenants: true,
  manageTenants: true,
  viewRooms: true,
  manageRooms: true,
  viewPayments: true,
  recordPayments: true,
  viewMaintenance: true,
  manageMaintenance: true,
  viewDocuments: true,
  uploadDocuments: true,
  viewProperty: true,
  editProperty: false,
  deleteProperty: false,
  manageSettings: false,
};

export default function PropertyManagersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedManagerForEdit, setSelectedManagerForEdit] = useState<any>(null);
  const [isAssignMoreOpen, setIsAssignMoreOpen] = useState(false);

  // Form State for Invite
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyIds: [] as string[],
    permissions: { ...DEFAULT_PERMISSIONS },
  });

  // Query: Managers list
  const { data: managersRes, isLoading } = useQuery({
    queryKey: ['landlord-property-managers'],
    queryFn: () => apiClient.get('/api/v1/property-managers').then(r => r.data.data),
  });

  // Query: Landlord properties (for selection in modals)
  const { data: propertiesRes } = useQuery({
    queryKey: ['landlord-properties-all'],
    queryFn: () => apiClient.get('/api/v1/properties', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const properties: any[] = propertiesRes || [];
  const managers: any[] = managersRes || [];

  // Mutation: Invite Manager
  const inviteMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/api/v1/property-managers/invite', payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['landlord-property-managers'] });
      setIsInviteOpen(false);
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        propertyIds: [],
        permissions: { ...DEFAULT_PERMISSIONS },
      });
      toast({
        title: 'Manager Assigned Successfully',
        description: res.data?.message || 'Property manager has been linked to selected properties.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Invitation Failed',
        description: err.response?.data?.message || 'Unable to invite property manager.',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Assign More Properties
  const assignMoreMutation = useMutation({
    mutationFn: ({ managerId, propertyIds }: { managerId: string; propertyIds: string[] }) =>
      apiClient.post(`/api/v1/property-managers/${managerId}/assign`, { propertyIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-property-managers'] });
      setIsAssignMoreOpen(false);
      setSelectedManagerForEdit(null);
      toast({ title: 'Properties Assigned', description: 'New property assignments added successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to assign properties.', variant: 'destructive' });
    },
  });

  // Mutation: Remove Property Assignment
  const removeAssignmentMutation = useMutation({
    mutationFn: ({ managerId, propertyId }: { managerId: string; propertyId: string }) =>
      apiClient.delete(`/api/v1/property-managers/${managerId}/properties/${propertyId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-property-managers'] });
      toast({ title: 'Assignment Removed', description: 'Manager has been unassigned from this property.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to remove assignment.', variant: 'destructive' });
    },
  });

  // Mutation: Update Permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ managerId, propertyId, permissions }: { managerId: string; propertyId: string; permissions: any }) =>
      apiClient.patch(`/api/v1/property-managers/${managerId}/properties/${propertyId}/permissions`, { permissions }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-property-managers'] });
      toast({ title: 'Permissions Updated', description: 'Manager permissions saved successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update permissions.', variant: 'destructive' });
    },
  });

  // Mutation: Revoke / Deactivate
  const deactivateMutation = useMutation({
    mutationFn: (managerId: string) => apiClient.post(`/api/v1/property-managers/${managerId}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-property-managers'] });
      toast({ title: 'Access Revoked', description: 'Manager access revoked across all your properties.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to revoke access.', variant: 'destructive' });
    },
  });

  // Mutation: Resend Invite
  const resendInviteMutation = useMutation({
    mutationFn: (managerId: string) => apiClient.post(`/api/v1/property-managers/${managerId}/resend-invite`),
    onSuccess: () => {
      toast({ title: 'Invite Resent', description: 'Invitation reminder sent to manager.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to resend invite.', variant: 'destructive' });
    },
  });

  // Filtered managers
  const filteredManagers = managers.filter((m) => {
    const user = m.manager || {};
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary Metrics
  const totalManagers = managers.length;
  const totalActiveAssignments = managers.reduce((acc, m) => acc + (m.propertiesCount || 0), 0);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.firstName || !inviteForm.email) {
      toast({ title: 'Missing Fields', description: 'Please enter manager name and email.', variant: 'destructive' });
      return;
    }
    if (inviteForm.propertyIds.length === 0) {
      toast({ title: 'Select Properties', description: 'Please assign at least one property to the manager.', variant: 'destructive' });
      return;
    }

    inviteMutation.mutate({
      firstName: inviteForm.firstName,
      lastName: inviteForm.lastName,
      email: inviteForm.email,
      phone: inviteForm.phone,
      propertyIds: inviteForm.propertyIds,
      permissions: inviteForm.permissions,
    });
  };

  const togglePropertyInInvite = (propId: string) => {
    setInviteForm((prev) => {
      const exists = prev.propertyIds.includes(propId);
      return {
        ...prev,
        propertyIds: exists ? prev.propertyIds.filter((id) => id !== propId) : [...prev.propertyIds, propId],
      };
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-bold text-xs shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Team &amp; Access Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 tracking-tight">Property Managers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Delegate operational duties, assign managers to specific properties, and configure granular permissions.
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-md flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Add Property Manager</span>
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border shadow-xs bg-gradient-to-br from-indigo-50/50 via-card to-card dark:from-indigo-950/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Managers</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">{totalManagers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border shadow-xs bg-gradient-to-br from-purple-50/50 via-card to-card dark:from-purple-950/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Properties</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">{properties.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border shadow-xs bg-gradient-to-br from-emerald-50/50 via-card to-card dark:from-emerald-950/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Property Assignments</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">{totalActiveAssignments}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search manager by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40 border-0 h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
          {(['ALL', 'ACTIVE', 'REVOKED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                statusFilter === tab
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'ALL' ? 'All Managers' : tab === 'ACTIVE' ? 'Active' : 'Revoked'}
            </button>
          ))}
        </div>
      </div>

      {/* Managers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredManagers.length === 0 ? (
        <Card className="rounded-3xl border text-center py-16">
          <CardContent className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-xs">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No property managers yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Invite team members to manage room inventory, record payments, and handle tenant requests.
              </p>
            </div>
            <Button
              onClick={() => setIsInviteOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs"
            >
              + Add Property Manager
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredManagers.map((item) => {
            const user = item.manager || {};
            const isRevoked = item.status === 'REVOKED';

            return (
              <Card
                key={user._id}
                className={cn(
                  'rounded-3xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between overflow-hidden',
                  isRevoked ? 'opacity-70 bg-muted/30' : 'bg-card',
                )}
              >
                <CardHeader className="pb-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground leading-snug">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs mt-1 inline-block',
                          isRevoked
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                        )}>
                          {isRevoked ? 'ACCESS REVOKED' : 'ACTIVE MANAGER'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-2 border-t">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Assigned Properties ({item.assignments?.length || 0})
                      </span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {item.assignments?.map((a: any) => {
                        const prop = a.property || {};
                        return (
                          <div
                            key={a.assignmentId}
                            className="p-2.5 rounded-xl bg-muted/40 border text-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{prop.name || 'Property'}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {prop.address?.city || 'City'} · {prop.totalRooms || 0} rooms
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                removeAssignmentMutation.mutate({ managerId: user._id, propertyId: prop._id })
                              }
                              className="text-muted-foreground hover:text-red-600 p-1 rounded-lg transition-colors"
                              title="Unassign this property"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedManagerForEdit(item);
                        setIsAssignMoreOpen(true);
                      }}
                      className="flex-1 rounded-xl text-xs font-semibold h-9"
                    >
                      + Assign Property
                    </Button>

                    {!isRevoked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deactivateMutation.mutate(user._id)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-semibold h-9"
                      >
                        Revoke Access
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInviteMutation.mutate(user._id)}
                        className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl text-xs font-semibold h-9"
                      >
                        Resend Invite
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── INVITE PROPERTY MANAGER MODAL ───────────────────────── */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Add Property Manager</h3>
                  <p className="text-xs text-muted-foreground">Assign a team member to manage your properties</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-foreground">First Name *</Label>
                  <Input
                    required
                    placeholder="Rahul"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground">Last Name</Label>
                  <Input
                    placeholder="Sharma"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground">Email Address *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="rahul@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-foreground">Phone Number</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Property Assignment Checkbox List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Select Properties to Assign ({inviteForm.propertyIds.length} selected) *
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (inviteForm.propertyIds.length === properties.length) {
                        setInviteForm({ ...inviteForm, propertyIds: [] });
                      } else {
                        setInviteForm({ ...inviteForm, propertyIds: properties.map((p) => p._id) });
                      }
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    {inviteForm.propertyIds.length === properties.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1 border rounded-2xl bg-muted/20">
                  {properties.map((p) => {
                    const isChecked = inviteForm.propertyIds.includes(p._id);
                    return (
                      <div
                        key={p._id}
                        onClick={() => togglePropertyInInvite(p._id)}
                        className={cn(
                          'p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all',
                          isChecked
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800'
                            : 'bg-card hover:bg-muted/40',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.address?.city || 'City'} · {p.totalRooms || 0} rooms
                          </p>
                        </div>
                        <div className={cn(
                          'h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors',
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-muted-foreground',
                        )}>
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" /> Operational Permissions
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {[
                    { key: 'viewTenants', label: 'View Tenants' },
                    { key: 'manageTenants', label: 'Add/Edit Tenants' },
                    { key: 'viewRooms', label: 'View Rooms' },
                    { key: 'manageRooms', label: 'Change Room Status' },
                    { key: 'viewPayments', label: 'View Payments' },
                    { key: 'recordPayments', label: 'Record/Verify Rent' },
                    { key: 'viewMaintenance', label: 'View Complaints' },
                    { key: 'manageMaintenance', label: 'Resolve Complaints' },
                    { key: 'editProperty', label: 'Edit Property Info' },
                  ].map((perm) => {
                    const active = (inviteForm.permissions as any)[perm.key];
                    return (
                      <label
                        key={perm.key}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none transition-colors',
                          active
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-foreground font-semibold'
                            : 'bg-card text-muted-foreground hover:bg-muted',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) =>
                            setInviteForm({
                              ...inviteForm,
                              permissions: {
                                ...inviteForm.permissions,
                                [perm.key]: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl shadow-md"
                >
                  {inviteMutation.isPending ? 'Assigning...' : 'Assign Manager →'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGN MORE PROPERTIES MODAL ───────────────────────── */}
      {isAssignMoreOpen && selectedManagerForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Assign Properties to {selectedManagerForEdit.manager?.firstName}
                </h3>
                <p className="text-xs text-muted-foreground">Select additional properties for this manager</p>
              </div>
              <button
                onClick={() => setIsAssignMoreOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-foreground">Available Properties</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {properties.map((p) => {
                  const alreadyAssigned = selectedManagerForEdit.assignments?.some(
                    (a: any) => (a.property?._id || a.property) === p._id,
                  );

                  return (
                    <div
                      key={p._id}
                      className={cn(
                        'p-3 rounded-xl border flex items-center justify-between gap-3 text-xs',
                        alreadyAssigned ? 'bg-muted/40 opacity-70' : 'bg-card hover:bg-muted/30',
                      )}
                    >
                      <div>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.address?.city} · {p.totalRooms} rooms</p>
                      </div>

                      {alreadyAssigned ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Assigned
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            assignMoreMutation.mutate({
                              managerId: selectedManagerForEdit.manager?._id,
                              propertyIds: [p._id],
                            })
                          }
                          disabled={assignMoreMutation.isPending}
                          className="h-8 text-xs font-semibold rounded-lg bg-indigo-600 text-white"
                        >
                          + Assign
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignMoreOpen(false)}
                className="rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
