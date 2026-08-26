'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Loader2, FileImage,
  Upload, X, ZoomIn, Download, Camera, RefreshCw,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const schema = z.object({
  utrNumber: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'OTHER']),
  paymentApp: z.string().optional(),
  paidAmount: z.number({ invalid_type_error: 'Enter a valid amount' }).positive('Must be positive'),
  note: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  // UTR is required for digital payments, optional for cash/cheque
  const needsUtr = !['CASH', 'CHEQUE'].includes(data.paymentMethod);
  if (needsUtr && (!data.utrNumber || data.utrNumber.trim().length < 8)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'UTR must be at least 8 characters', path: ['utrNumber'] });
  }
  if (data.utrNumber && !/^[A-Za-z0-9]*$/.test(data.utrNumber)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Alphanumeric only', path: ['utrNumber'] });
  }
});
type Form = z.infer<typeof schema>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UPI_APPS = ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay', 'Other'];

interface UploadState {
  file: File | null;
  preview: string;
  progress: number;
  uploading: boolean;
  uploaded: boolean;
  path: string;
  error: string;
}

const INITIAL_UPLOAD: UploadState = {
  file: null, preview: '', progress: 0, uploading: false, uploaded: false, path: '', error: '',
};

export default function TenantPaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadState>(INITIAL_UPLOAD);
  const [lightbox, setLightbox] = useState(false);

  const { data: payment, isLoading } = useQuery({
    queryKey: ['my-payment', id],
    queryFn: () => apiClient.get(`/api/v1/payments/${id}`).then(r => r.data.data),
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'UPI', paidAmount: payment?.amount },
  });

  const paymentMethod = watch('paymentMethod');

  // ── Real upload with progress ────────────────────────────────────────────
  const doUpload = useCallback(async (file: File) => {
    const preview = URL.createObjectURL(file);
    setUpload({ file, preview, progress: 0, uploading: true, uploaded: false, path: '', error: '' });

    const form = new FormData();
    form.append('file', file);
    form.append('category', 'payments');

    // Animate progress
    const tick = setInterval(() => {
      setUpload(prev => ({ ...prev, progress: Math.min(prev.progress + 8, 88) }));
    }, 150);

    try {
      const res = await apiClient.post('/api/v1/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded / e.total) * 90);
            setUpload(prev => ({ ...prev, progress: pct }));
          }
        },
      });
      clearInterval(tick);
      setUpload(prev => ({ ...prev, progress: 100, uploading: false, uploaded: true, path: res.data.data.filePath }));
    } catch {
      clearInterval(tick);
      setUpload(prev => ({ ...prev, uploading: false, error: 'Upload failed. Please try again.' }));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  const resetUpload = () => {
    if (upload.preview) URL.revokeObjectURL(upload.preview);
    setUpload(INITIAL_UPLOAD);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const isCashOrCheque = ['CASH', 'CHEQUE'].includes(paymentMethod);
  const needsScreenshot = !isCashOrCheque;

  const { mutate: submit, isPending, isError, error } = useMutation({
    mutationFn: (data: Form) =>
      apiClient.post(`/api/v1/payments/${id}/submit`, { ...data, screenshotPath: upload.path || '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-payment', id] });
      qc.invalidateQueries({ queryKey: ['my-payments'] });
      router.push('/payments');
    },
  });

  const onSubmit = (data: Form) => {
    if (needsScreenshot && !upload.uploaded) return;
    submit(data);
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    );
  }
  if (!payment) return <div className="text-center py-16 text-muted-foreground">Payment not found</div>;

  const isPendingPayment = payment.status === 'PENDING';
  const isSubmitted = ['PAYMENT_SUBMITTED', 'UNDER_REVIEW'].includes(payment.status);
  const isPaid = payment.status === 'PAID';
  const isRejected = payment.status === 'REJECTED';

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-24 lg:pb-8">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/payments">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {MONTHS[(payment.month ?? 1) - 1]} {payment.year} Rent
          </h1>
          <p className="text-sm text-muted-foreground">Due {formatDate(payment.dueDate)}</p>
        </div>
      </div>

      {/* Amount Card */}
      <div className={cn(
        'rounded-2xl p-6 text-center border-2',
        isPaid ? 'bg-emerald-50 border-emerald-200' :
        isSubmitted ? 'bg-blue-50 border-blue-200' :
        isRejected ? 'bg-red-50 border-red-200' :
        'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
      )}>
        <p className={cn('text-5xl font-extrabold tracking-tight',
          isPaid ? 'text-emerald-700' : isSubmitted ? 'text-blue-700' : isRejected ? 'text-red-700' : 'text-indigo-700'
        )}>
          {formatCurrency(payment.amount)}
        </p>
        <div className={cn('flex items-center justify-center gap-1.5 mt-3 text-sm font-semibold',
          isPaid ? 'text-emerald-600' : isSubmitted ? 'text-blue-600' : isRejected ? 'text-red-600' : 'text-indigo-600'
        )}>
          {isPaid && <><CheckCircle className="h-4 w-4" /> Verified & Paid</>}
          {isSubmitted && <><Loader2 className="h-4 w-4 animate-spin" /> Submitted — Awaiting Verification</>}
          {isRejected && <><AlertTriangle className="h-4 w-4" /> Payment Rejected</>}
          {isPendingPayment && <><AlertTriangle className="h-4 w-4" /> Payment Due</>}
        </div>
      </div>

      {/* Rejection Banner */}
      {isRejected && payment.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700">{payment.rejectionReason}</p>
          <p className="text-xs text-red-600 mt-2">Please re-submit with correct payment proof.</p>
        </div>
      )}

      {/* Payment Methods */}
      {(isPendingPayment || isRejected) && payment.propertyId?.paymentMethods && (
        <div className="bg-card rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold text-foreground text-sm">Pay To</h2>
          {payment.propertyId.paymentMethods.upiId && (
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div>
                <p className="text-xs text-indigo-500 font-medium mb-0.5">UPI ID</p>
                <p className="font-mono font-bold text-foreground">{payment.propertyId.paymentMethods.upiId}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(payment.propertyId.paymentMethods.upiId)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >Copy</button>
            </div>
          )}
          {payment.propertyId.paymentMethods.bankAccount && (
            <div className="p-3 bg-muted rounded-xl border text-sm space-y-1">
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Bank Transfer</p>
              {[
                ['Bank', payment.propertyId.paymentMethods.bankAccount.bankName],
                ['Account No.', payment.propertyId.paymentMethods.bankAccount.accountNumber],
                ['IFSC', payment.propertyId.paymentMethods.bankAccount.ifsc],
                ['Name', payment.propertyId.paymentMethods.bankAccount.accountHolder],
              ].map(([k, v]) => v && (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium text-foreground">{v}</span>
                </div>
              ))}
            </div>
          )}
          {payment.propertyId.paymentMethods.instructions && (
            <p className="text-xs text-muted-foreground italic">{payment.propertyId.paymentMethods.instructions}</p>
          )}
        </div>
      )}

      {/* Submit Form */}
      {(isPendingPayment || isRejected) && (
        <div className="bg-card rounded-xl border p-5 space-y-5">
          <h2 className="font-semibold text-foreground">Upload Payment Proof</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Screenshot Upload — only for digital payments */}
            {needsScreenshot && (
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {!upload.preview ? (
                /* Drop Zone */
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
                >
                  <div className="h-14 w-14 rounded-xl bg-muted group-hover:bg-indigo-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                    <FileImage className="h-7 w-7 text-muted-foreground group-hover:text-indigo-500" />
                  </div>
                  <p className="font-semibold text-muted-foreground group-hover:text-indigo-600 transition-colors">
                    Upload payment screenshot
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Drop here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-3">JPG, PNG, WebP · Max 20MB</p>
                </div>
              ) : (
                /* Preview with progress */
                <div className="rounded-xl overflow-hidden border border-border relative">
                  {/* Image */}
                  <img
                    src={upload.preview}
                    alt="Payment screenshot"
                    className={cn('w-full max-h-80 object-contain bg-muted transition-all', upload.uploading && 'opacity-50')}
                  />

                  {/* Uploading overlay */}
                  {upload.uploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                      <p className="text-white font-semibold text-sm">Uploading screenshot...</p>
                      <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-card rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <p className="text-white/80 text-xs">{upload.progress}%</p>
                    </div>
                  )}

                  {/* Success badge */}
                  {upload.uploaded && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                      <CheckCircle className="h-3.5 w-3.5" /> Uploaded successfully
                    </div>
                  )}

                  {/* Error overlay */}
                  {upload.error && (
                    <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-white" />
                      <p className="text-white font-semibold text-sm">{upload.error}</p>
                      <button onClick={resetUpload} className="mt-1 px-4 py-2 rounded-lg bg-card text-red-700 text-sm font-semibold">
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!upload.uploading && !upload.error && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLightbox(true)}
                        className="h-8 w-8 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={resetUpload}
                        className="h-8 w-8 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Cash/Cheque info hint */}
            {isCashOrCheque && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                No screenshot needed for {paymentMethod.toLowerCase()} payments
              </div>
            )}

            {/* UTR / Reference Number */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">
                {isCashOrCheque ? 'Receipt / Reference Number' : 'UTR / Reference Number'}
                {!isCashOrCheque && <span className="text-red-500"> *</span>}
                {isCashOrCheque && <span className="text-muted-foreground font-normal"> (optional)</span>}
              </label>
              <input
                {...register('utrNumber')}
                placeholder={isCashOrCheque ? 'e.g. receipt number or cheque no.' : 'e.g. 316025892341'}
                className="w-full h-10 px-3 rounded-lg border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {!isCashOrCheque && (
                <p className="text-xs text-muted-foreground mt-1">Find the UTR/Ref No. in your UPI app transaction history</p>
              )}
              {errors.utrNumber && <p className="text-xs text-red-500 mt-1">{errors.utrNumber.message}</p>}
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">
                Amount Paid <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <input
                  {...register('paidAmount', { valueAsNumber: true })}
                  type="number"
                  defaultValue={payment.amount}
                  className="w-full h-10 pl-7 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {errors.paidAmount && <p className="text-xs text-red-500 mt-1">{errors.paidAmount.message as string}</p>}
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1.5">Payment Method</label>
                <select {...register('paymentMethod')} className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              {paymentMethod === 'UPI' && (
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">UPI App</label>
                  <select {...register('paymentApp')} className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Select</option>
                    {UPI_APPS.map(a => <option key={a} value={a.toUpperCase().replace(' ', '_')}>{a}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5">Note (optional)</label>
              <textarea
                {...register('note')}
                rows={2}
                placeholder="Any additional info for your landlord..."
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            {/* Error */}
            {isError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {(error as any)?.response?.data?.message ?? 'Submission failed. Please try again.'}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || (needsScreenshot && (upload.uploading || !upload.uploaded))}
              className={cn(
                'w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                (isCashOrCheque || upload.uploaded) && !isPending
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isPending
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</>
                : needsScreenshot && upload.uploading
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Uploading screenshot ({upload.progress}%)...</>
                  : needsScreenshot && !upload.uploaded
                    ? <><FileImage className="h-5 w-5" /> Upload screenshot to continue</>
                    : <><Upload className="h-5 w-5" /> Submit Payment Proof</>
              }
            </button>
            {needsScreenshot && !upload.uploaded && !upload.uploading && (
              <p className="text-center text-xs text-muted-foreground">Upload your payment screenshot above to enable submission</p>
            )}
          </form>
        </div>
      )}

      {/* Submitted State */}
      {isSubmitted && payment.submission && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-800 font-semibold">
            <Loader2 className="h-5 w-5 animate-spin" /> Awaiting Landlord Verification
          </div>
          <div className="text-sm text-blue-700 space-y-1.5">
            <div className="flex justify-between"><span className="text-blue-500">UTR Number</span><span className="font-mono font-semibold">{payment.submission.utrNumber}</span></div>
            <div className="flex justify-between"><span className="text-blue-500">Amount Paid</span><span className="font-semibold">{formatCurrency(payment.submission.paidAmount)}</span></div>
            <div className="flex justify-between"><span className="text-blue-500">Method</span><span>{payment.submission.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-blue-500">Submitted</span><span>{formatDate(payment.submission.submittedAt)}</span></div>
          </div>
          <p className="text-xs text-blue-600 bg-blue-100 rounded-lg px-3 py-2">
            💡 Your landlord will review and verify your payment. You'll receive a notification once done.
          </p>
        </div>
      )}

      {/* Paid / Receipt State */}
      {isPaid && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-3">
            <CheckCircle className="h-5 w-5" /> Payment Verified
          </div>
          {payment.receipt && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-emerald-700">
                <p>Receipt: <span className="font-mono">{payment.receipt.receiptId}</span></p>
                <p className="text-xs text-emerald-600 mt-0.5">Verified on {formatDate(payment.receipt.generatedAt)}</p>
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/${id}/receipt`}
                target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4" /> Receipt
              </a>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && upload.preview && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
            <X className="h-5 w-5" />
          </button>
          <img src={upload.preview} alt="Screenshot" className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
