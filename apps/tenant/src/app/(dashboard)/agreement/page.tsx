'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FileText, Download, Calendar, Building2, User, ArrowLeft,
  ChevronRight, AlertCircle, Scroll,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, formatDateShort } from '@/lib/utils';

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default function AgreementPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['tenant-profile'],
    queryFn: () => apiClient.get('/api/v1/tenants/my-profile').then(r => r.data.data),
  });

  const { data: agreementDocs } = useQuery({
    queryKey: ['my-documents', 'agreements'],
    queryFn: () => apiClient.get('/api/v1/documents', { params: { category: 'agreements' } }).then(r => r.data.data),
    enabled: !!profile,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
          <p className="font-semibold text-yellow-800">No Active Agreement</p>
          <p className="text-sm text-yellow-700 mt-1">You don't have an active tenancy. Browse available PGs below.</p>
          <Link href="/marketplace" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
            Browse PGs <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const monthlyRent = profile.agreedRent?.toLocaleString('en-IN');
  const deposit = profile.securityDeposit?.toLocaleString('en-IN');

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Scroll className="h-6 w-6 text-indigo-600" />
          My Agreement
        </h1>
      </div>

      {/* Agreement summary */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm">Rental Agreement</p>
            <p className="text-xl font-bold mt-1">{profile.propertyId?.name}</p>
            <p className="text-indigo-200 text-sm mt-0.5">
              Room {profile.roomId?.roomNumber} {profile.bedId ? `· Bed ${profile.bedId?.bedNumber}` : ''}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-indigo-200 text-xs">Monthly Rent</p>
            <p className="text-lg font-bold mt-0.5">₹{monthlyRent}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-indigo-200 text-xs">Deposit</p>
            <p className="text-lg font-bold mt-0.5">₹{deposit}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-indigo-200 text-xs">Due Day</p>
            <p className="text-lg font-bold mt-0.5">{profile.rentDueDay}th</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold text-foreground mb-3">Agreement Status</h2>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Active Tenancy</p>
            <p className="text-xs text-emerald-600">Agreement is currently active and in good standing</p>
          </div>
        </div>
      </div>

      {/* Tenancy Details */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold text-foreground mb-1">Tenancy Details</h2>
        <p className="text-xs text-muted-foreground mb-4">Summary of your current rental agreement</p>
        <div>
          <InfoRow label="Property" value={profile.propertyId?.name} />
          <InfoRow label="Address" value={profile.propertyId?.address?.formatted} />
          <InfoRow label="Room Number" value={profile.roomId?.roomNumber} />
          <InfoRow label="Joining Date" value={formatDateShort(profile.joiningDate)} />
          {profile.agreementEndDate && <InfoRow label="Agreement End" value={formatDateShort(profile.agreementEndDate)} />}
          <InfoRow label="Monthly Rent" value={`₹${monthlyRent}`} />
          <InfoRow label="Security Deposit" value={`₹${deposit}`} />
          <InfoRow label="Rent Due Day" value={`${profile.rentDueDay}th of every month`} />
          <InfoRow label="Notice Period" value={profile.noticePeriodDays ? `${profile.noticePeriodDays} days` : undefined} />
        </div>
      </div>

      {/* Landlord Info */}
      {profile.landlordId && (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> Landlord
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {profile.landlordId.firstName?.[0]}{profile.landlordId.lastName?.[0]}
            </div>
            <div>
              <p className="font-medium text-foreground">{profile.landlordId.firstName} {profile.landlordId.lastName}</p>
              <p className="text-sm text-muted-foreground">{profile.landlordId.phone}</p>
              <p className="text-xs text-muted-foreground">{profile.landlordId.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Agreements */}
      <div className="bg-card rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Agreement Documents
          </h2>
          <Link href="/documents" className="text-xs text-indigo-600 font-medium hover:underline">
            Manage documents
          </Link>
        </div>

        {agreementDocs?.length === 0 || !agreementDocs ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">No agreement documents uploaded yet</p>
            <Link href="/documents" className="text-xs text-indigo-600 mt-2 inline-block hover:underline">
              Upload your signed agreement →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {agreementDocs.map((doc: any) => {
              const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${doc.filePath?.split('/uploads/')[1]}`;
              return (
                <div key={doc._id} className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
                  <FileText className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.originalName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                  </div>
                  <a
                    href={fileUrl}
                    download={doc.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Terms */}
      {profile.specialTerms && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-900 mb-2 text-sm">Special Terms & Conditions</h2>
          <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{profile.specialTerms}</p>
        </div>
      )}
    </div>
  );
}
