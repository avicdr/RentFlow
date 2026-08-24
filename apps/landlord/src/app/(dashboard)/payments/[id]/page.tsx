'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  ArrowLeft, Download, CheckCircle, XCircle, Clock, Eye,
  FileImage, RefreshCw, AlertCircle,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, Textarea } from '@/components/ui/misc';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate, getPaymentStatusColor } from '@/lib/utils';

const rejectSchema = z.object({
  reason: z.string().min(10, 'Provide a clear reason (min 10 chars)'),
});

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => apiClient.get(`/api/v1/payments/${id}`).then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(rejectSchema),
  });

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: () => apiClient.patch(`/api/v1/payments/${id}/approve`, {}),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['payment', id] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: '✅ Payment approved!', description: `Receipt: ${res.data.data?.receiptId}` });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  const { mutate: setUnderReview } = useMutation({
    mutationFn: () => apiClient.patch(`/api/v1/payments/${id}/under-review`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment', id] });
      toast({ title: 'Marked as under review' });
    },
  });

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: (data: { reason: string }) => apiClient.patch(`/api/v1/payments/${id}/reject`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment', id] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      setShowRejectModal(false);
      reset();
      toast({ title: 'Payment rejected. Tenant notified.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-xl" /><div className="h-64 bg-muted rounded-xl" /></div>;
  if (!payment) return <div className="text-center py-16 text-muted-foreground">Payment not found</div>;

  const canAction = ['PAYMENT_SUBMITTED', 'UNDER_REVIEW'].includes(payment.status);
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAYMENT_SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-orange-100 text-orange-800',
    PAID: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/payments">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Payment Review</h1>
          <p className="text-muted-foreground text-sm">
            {payment.month}/{payment.year} · {formatCurrency(payment.amount)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[payment.status] ?? ''}`}>
          {payment.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Tenant & Payment Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Tenant Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{payment.tenantId?.userId?.firstName} {payment.tenantId?.userId?.lastName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{payment.tenantId?.userId?.phone ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate max-w-[140px]">{payment.tenantId?.userId?.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Agreed Rent</span><span className="font-medium">{formatCurrency(payment.tenantId?.agreedRent ?? 0)}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Payment Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Amount Due</span><span className="font-semibold">{formatCurrency(payment.amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{formatDate(payment.dueDate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{payment.type}</span></div>
            {payment.latePenalty > 0 && (
              <div className="flex justify-between text-red-600"><span>Late Penalty</span><span>+{formatCurrency(payment.latePenalty)}</span></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Submission */}
      {payment.submission && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileImage className="h-5 w-5 text-blue-600" />
              Payment Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Method</span><p className="font-medium">{payment.submission.paymentMethod} {payment.submission.paymentApp ? `(${payment.submission.paymentApp})` : ''}</p></div>
              <div><span className="text-muted-foreground">Amount Paid</span><p className="font-semibold text-green-700">{formatCurrency(payment.submission.paidAmount)}</p></div>
              <div><span className="text-muted-foreground">UTR / Reference</span><p className="font-mono font-medium">{payment.submission.utrNumber}</p></div>
              <div><span className="text-muted-foreground">Submitted At</span><p>{formatDate(payment.submission.submittedAt)}</p></div>
            </div>
            {payment.submission.note && (
              <div className="pt-2 border-t"><p className="text-muted-foreground text-xs">Tenant note:</p><p className="text-sm italic">"{payment.submission.note}"</p></div>
            )}
            {/* Screenshot */}
            {payment.submission.screenshotPath && (
              <div className="pt-2">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${payment.submission.screenshotPath.split('/uploads/')[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium"
                >
                  <Eye className="h-4 w-4" /> View Screenshot
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canAction && (
        <Card>
          <CardHeader><CardTitle className="text-base">Verification Action</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {payment.status === 'PAYMENT_SUBMITTED' && (
              <Button variant="outline" onClick={() => setUnderReview()} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Mark Under Review
              </Button>
            )}
            <Button
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => {
                if (confirm('Confirm payment approval? A receipt will be generated and tenant notified.')) approve();
              }}
              disabled={approving}
            >
              <CheckCircle className="h-4 w-4" />
              {approving ? 'Approving...' : 'Approve Payment'}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowRejectModal(true)}
            >
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Receipt */}
      {payment.status === 'PAID' && payment.receipt && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">Payment Verified ✓</p>
                <p className="text-sm text-green-700 mt-1">Receipt ID: <span className="font-mono">{payment.receipt.receiptId}</span></p>
                <p className="text-xs text-muted-foreground">Verified on {formatDate(payment.verification?.verifiedAt)}</p>
              </div>
              <a href={`/api/v1/payments/${id}/receipt`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 border-green-600 text-green-700 hover:bg-green-100">
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection history */}
      {payment.verification?.action === 'REJECTED' && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Previously Rejected</p>
                <p className="text-sm text-red-700 mt-1">Reason: {payment.verification.rejectionReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-red-600">Reject Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((d) => reject({ reason: d.reason }))} className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Provide a clear reason. The tenant will be notified and asked to resubmit.
                  </p>
                  <Textarea
                    placeholder="e.g. UTR number doesn't match the transaction amount..."
                    {...register('reason')}
                    rows={4}
                  />
                  {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message as string}</p>}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="destructive" className="flex-1" disabled={rejecting}>
                    {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowRejectModal(false); reset(); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
