'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Building2, MapPin, Users, Bed, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, Skeleton } from '@/components/ui/misc';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'success', DRAFT: 'secondary', INACTIVE: 'outline', MAINTENANCE: 'warning',
};

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['properties', { search, status: statusFilter }],
    queryFn: () =>
      apiClient
        .get('/api/v1/properties', { params: { search, status: statusFilter || undefined, limit: 50 } })
        .then((r) => r.data),
  });

  const { mutate: deleteProperty } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      toast({ title: 'Property deleted', variant: 'default' });
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  });

  const properties = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">{properties.length} total properties</p>
        </div>
        <Link href="/properties/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="h-4 w-4" /> Add Property
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Property Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No properties yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Add your first property to get started</p>
          <Link href="/properties/new">
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">Add Property</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p: any) => (
            <Card key={p._id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{p.type?.toLowerCase()}</p>
                    </div>
                  </div>
                  <Badge variant={STATUS_COLORS[p.status] as any ?? 'secondary'}>
                    {p.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{p.address?.city}, {p.address?.state}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{p.occupiedBeds}/{p.totalBeds} beds</span>
                    <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{p.totalRooms} rooms</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 pt-4 border-t">
                  <Link href={`/properties/${p._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </Link>
                  <Link href={`/properties/${p._id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Delete this property? This action cannot be undone.')) {
                        deleteProperty(p._id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
