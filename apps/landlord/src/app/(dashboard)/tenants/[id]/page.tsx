'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, User, Home, CreditCard, FileText, Phone, Mail,
  Calendar, IndianRupee, Upload, Download, X, CheckCircle,
  AlertCircle, Clock, Building2, Loader2, FileImage, Shield,
  History,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

const TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'stays', label: 'Stay History', icon: History },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'documents', label: 'Documents', icon: FileText },
];

const DOC_CATEGORIES = [
  { value: 'LEASE', label: 'Lease Agreement', color: 'bg-blue-100 text-blue-700' },
  { value: 'AGREEMENT', label: 'Property Agreement', color: 'bg-purple-100 text-purple-700' },
  { value: 'NOTICE', label: 'Notice', color: 'bg-orange-100 text-orange-700' },
  { value: 'AADHAR', label: 'Aadhaar', color: 'bg-green-100 text-green-700' },
  { value: 'ID_PROOF', label: 'ID Proof', color: 'bg-teal-100 text-teal-700' },
  { value: 'OTHER', label: 'Other', color: 'bg-muted text-muted-foreground' },
];

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PAID: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  PAYMENT_SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-orange-100 text-orange-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getCategoryConfig(cat: string) {
  return DOC_CATEGORIES.find(d => d.value === cat) ?? DOC_CATEGORIES[DOC_CATEGORIES.length - 1];
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 flex justify-between gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground text-right">{value}</span>
      </div>
    </div>
  );
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('LEASE');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: tenantRes, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => apiClient.get(`/api/v1/tenants/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['tenant-payments', id],
    queryFn: () => apiClient.get('/api/v1/payments', { params: { tenantId: id, limit: 24 } }).then(r => r.data.data),
    enabled: !!id && activeTab === 'payments',
  });

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['tenant-docs', id],
    queryFn: () => apiClient.get(`/api/v1/documents/tenant/${id}`).then(r => r.data.data),
    enabled: !!id && activeTab === 'documents',
  });

  const { mutate: uploadDoc, isPending: uploading } = useMutation({
    mutationFn: (formData: FormData) => apiClient.post(`/api/v1/documents/tenant/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-docs', id] });
      setShowUpload(false);
      setUploadFile(null);
      setUploadDesc('');
    },
  });

  const { data: scoreRes } = useQuery({
    queryKey: ['tenant-reliability', id],
    queryFn: () => apiClient.get(`/api/v1/reliability/tenant/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: staysData } = useQuery({
    queryKey: ['tenant-stays', id],
    queryFn: () => apiClient.get(`/api/v1/tenants/${id}/stay-history`).then(r => r.data.data),
    enabled: !!id,
  });

  const reliability = scoreRes;

  const handleUpload = () => {
    if (!uploadFile) return;
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('category', uploadCategory);
    fd.append('description', uploadDesc);
    uploadDoc(fd);
  };

  if (isLoading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 bg-muted rounded-2xl" />
      <div className="h-64 bg-muted rounded-2xl" />
    </div>
  );

  if (!tenantRes) return (
    <div className="text-center py-20 text-muted-foreground">
      <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p>Tenant not found</p>
      <Link href="/tenants" className="text-indigo-600 text-sm mt-2 inline-block">Back to tenants</Link>
    </div>
  );

  const t = tenantRes;
  const user = t.userId ?? {};
  const property = t.propertyId ?? {};
  const room = t.roomId ?? {};
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/tenants" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {initials || '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.firstName} {user.lastName}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
          t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
        }`}>{t.status ?? 'ACTIVE'}</span>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="flex border-b">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" /> Personal Info
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={user.phone ?? '—'} />
                  <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={user.email ?? '—'} />
                  <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Joined" value={t.joiningDate ? formatDate(t.joiningDate) : '—'} />
                  {t.emergencyContact?.name && (
                    <InfoRow
                      icon={<Shield className="h-3.5 w-3.5" />}
                      label="Emergency"
                      value={`${t.emergencyContact.name} (${t.emergencyContact.relation ?? 'Contact'})`}
                    />
                  )}
                </div>
              </div>

              {/* Property Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" /> Property
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={<Home className="h-3.5 w-3.5" />} label="Property" value={property.name ?? '—'} />
                  <InfoRow
                    icon={<Home className="h-3.5 w-3.5" />}
                    label="Room"
                    value={room.roomNumber ? `Room ${room.roomNumber} (${room.type?.replace('_', ' ')})` : '—'}
                  />
                  <InfoRow
                    icon={<IndianRupee className="h-3.5 w-3.5" />}
                    label="Agreed Rent"
                    value={`₹${(t.agreedRent ?? 0).toLocaleString('en-IN')}/month`}
                  />
                  <InfoRow
                    icon={<IndianRupee className="h-3.5 w-3.5" />}
                    label="Security Deposit"
                    value={`₹${(t.securityDeposit ?? 0).toLocaleString('en-IN')}`}
                  />
                  <InfoRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Rent Due Day"
                    value={`${t.rentDueDay ?? 5}th of each month`}
                  />
                </div>
              </div>

              {/* Reliability Score Card */}
              {reliability && (
                <div className="sm:col-span-2 pt-6 border-t border-border">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100 dark:border-indigo-900/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-bold text-base text-foreground">RentFlow Reliability Score</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Comprehensive rental trust rating based on payment consistency and verification
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                            {reliability.currentScore ?? 85}
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground"> / 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Factors */}
                    <div className="grid gap-3 sm:grid-cols-5 pt-4">
                      {[
                        { label: 'Payment History', value: reliability.breakdown?.paymentHistory ?? 90 },
                        { label: 'KYC Verification', value: reliability.breakdown?.kycVerification ?? 80 },
                        { label: 'Tenancy Stability', value: reliability.breakdown?.tenancyStability ?? 85 },
                        { label: 'Outstanding Dues', value: reliability.breakdown?.outstandingDues ?? 95 },
                        { label: 'Agreement Status', value: reliability.breakdown?.agreementStatus ?? 90 },
                      ].map(factor => (
                        <div key={factor.label} className="p-3 rounded-xl bg-card border text-center">
                          <p className="text-[11px] text-muted-foreground truncate">{factor.label}</p>
                          <p className="text-lg font-bold text-foreground mt-0.5">{factor.value}%</p>
                          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${factor.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Positive drivers */}
                    {reliability.positiveFactors?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {reliability.positiveFactors.map((f: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="h-3 w-3" /> {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAY HISTORY TAB */}
          {activeTab === 'stays' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Complete Rental & Stay History</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Verified record of past and current stays across RentFlow properties</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {staysData?.length ?? 1} Recorded Stay{(staysData?.length ?? 1) !== 1 ? 's' : ''}
                </span>
              </div>

              {!staysData || staysData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-2xl bg-card">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No previous stay history records found</p>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
                          <th className="px-5 py-3">Property</th>
                          <th className="px-5 py-3">Room / Unit</th>
                          <th className="px-5 py-3">Landlord</th>
                          <th className="px-5 py-3">Period</th>
                          <th className="px-5 py-3 text-right">Rent</th>
                          <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {staysData.map((s: any) => (
                          <tr key={s._id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-foreground">
                              {s.propertyId?.name ?? '—'}
                              {s.propertyId?.city && <span className="text-xs text-muted-foreground block">{s.propertyId.city}</span>}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-foreground font-mono">
                              Room {s.roomId?.roomNumber || '—'}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground">
                              {s.landlordId ? `${s.landlordId.firstName} ${s.landlordId.lastName}` : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                              {s.joiningDate ? formatDate(s.joiningDate) : '—'} → {s.vacatingDate ? formatDate(s.vacatingDate) : 'Present'}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-foreground">
                              ₹{(s.agreedRent ?? 0).toLocaleString('en-IN')}/mo
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div>
              <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
              {!paymentsData || paymentsData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No payment records yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Period</th>
                        <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                        <th className="pb-3 font-medium text-muted-foreground">Due Date</th>
                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 font-medium text-muted-foreground">UTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paymentsData.map((p: any) => {
                        const sc = PAYMENT_STATUS_CONFIG[p.status] ?? { label: p.status, color: 'bg-muted text-muted-foreground' };
                        return (
                          <tr key={p._id}>
                            <td className="py-3 font-mono text-xs">{MONTHS[(p.month ?? 1) - 1]} {p.year}</td>
                            <td className="py-3 font-semibold">₹{(p.amount ?? 0).toLocaleString('en-IN')}</td>
                            <td className="py-3 text-muted-foreground">{p.dueDate ? formatDate(p.dueDate) : '—'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
                            </td>
                            <td className="py-3 font-mono text-xs text-muted-foreground">{p.submission?.utrNumber ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Documents</h3>
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload for Tenant
                </button>
              </div>

              {/* Upload Form */}
              {showUpload && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
                  <p className="font-semibold text-indigo-900 text-sm">Upload Document for Tenant</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Category</label>
                      <select
                        value={uploadCategory}
                        onChange={e => setUploadCategory(e.target.value)}
                        className="w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-card"
                      >
                        {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Description (optional)</label>
                      <input
                        type="text"
                        value={uploadDesc}
                        onChange={e => setUploadDesc(e.target.value)}
                        placeholder="e.g. Lease for FY 2025-26"
                        className="w-full h-10 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-card"
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      className="hidden"
                      onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                    >
                      {uploadFile ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-indigo-700">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">{uploadFile.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <FileImage className="h-8 w-8 text-indigo-300 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Click to choose a file</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, Images up to 20MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpload}
                      disabled={!uploadFile || uploading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      onClick={() => { setShowUpload(false); setUploadFile(null); }}
                      className="px-4 py-2 rounded-xl border text-sm text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Documents List */}
              {docsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
                </div>
              ) : !docsData || docsData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No documents yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {docsData.map((doc: any) => {
                    const catCfg = getCategoryConfig(doc.category);
                    const isLandlordUpload = doc.relatedTo != null;
                    const filePath = doc.filePath?.split('uploads\\').pop()?.split('uploads/').pop();
                    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${filePath}`;
                    return (
                      <div
                        key={doc._id}
                        className="flex items-center gap-4 p-4 bg-muted rounded-xl border hover:bg-muted transition-colors"
                      >
                        <div className="h-10 w-10 rounded-xl bg-card border flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{doc.originalName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catCfg.color}`}>
                              {catCfg.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {doc.createdAt ? formatDate(doc.createdAt) : ''}
                            </span>
                            {isLandlordUpload
                              ? <span className="text-xs text-purple-600 font-medium">📎 By You</span>
                              : <span className="text-xs text-green-600 font-medium">📤 By Tenant</span>
                            }
                          </div>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                          )}
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex-shrink-0"
                        >
                          <Download className="h-4 w-4" /> View
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
