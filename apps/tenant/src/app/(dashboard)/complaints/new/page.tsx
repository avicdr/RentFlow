'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, ImagePlus, X, Loader2, Send, AlertCircle, CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  category: z.enum(['PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'NOISE', 'PEST', 'MAINTENANCE', 'WIFI', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string().min(20, 'Please describe the issue in at least 20 characters').max(1000),
  landlordId: z.string().optional(),
  propertyId: z.string().optional(),
  roomId: z.string().optional(),
});

type Form = z.infer<typeof schema>;

const CATEGORIES = [
  { value: 'PLUMBING', label: 'Plumbing', emoji: '🔧' },
  { value: 'ELECTRICAL', label: 'Electrical', emoji: '⚡' },
  { value: 'CLEANING', label: 'Cleaning', emoji: '🧹' },
  { value: 'SECURITY', label: 'Security', emoji: '🔒' },
  { value: 'NOISE', label: 'Noise', emoji: '🔊' },
  { value: 'PEST', label: 'Pest Control', emoji: '🐛' },
  { value: 'MAINTENANCE', label: 'Maintenance', emoji: '🛠️' },
  { value: 'WIFI', label: 'WiFi / Internet', emoji: '📶' },
  { value: 'OTHER', label: 'Other', emoji: '📋' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low', desc: 'Minor issue, not urgent', color: 'border-border text-muted-foreground has-[:checked]:border-gray-500 has-[:checked]:bg-muted' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Needs attention soon', color: 'border-yellow-300 text-yellow-700 has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-50' },
  { value: 'HIGH', label: 'High', desc: 'Significant inconvenience', color: 'border-orange-300 text-orange-700 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Safety hazard / Urgent', color: 'border-red-300 text-red-700 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' },
];

interface ImageUpload { file: File; preview: string; uploading: boolean; uploaded: boolean; path: string; error: string; }

export default function NewComplaintPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', category: 'OTHER' },
  });

  const { data: profileData, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.get('/api/v1/tenants/my-profile').then(r => r.data.data),
    retry: 1,
  });

  const category = watch('category');
  const priority = watch('priority');
  const description = watch('description') ?? '';

  // ── Image Upload ─────────────────────────────────────────────────────────
  const uploadImage = useCallback(async (file: File, index: number) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, uploading: true, error: '' } : img));
    const form = new FormData();
    form.append('file', file);
    form.append('category', 'complaints');
    try {
      const res = await apiClient.post('/api/v1/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImages(prev => prev.map((img, i) => i === index ? { ...img, uploading: false, uploaded: true, path: res.data.data.filePath } : img));
    } catch {
      setImages(prev => prev.map((img, i) => i === index ? { ...img, uploading: false, error: 'Upload failed' } : img));
    }
  }, []);

  const addImages = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - images.length);
    const newImages: ImageUpload[] = arr.map(file => ({
      file, preview: URL.createObjectURL(file), uploading: false, uploaded: false, path: '', error: '',
    }));
    setImages(prev => {
      const updated = [...prev, ...newImages];
      // Start uploads
      newImages.forEach((_, i) => {
        const idx = prev.length + i;
        setTimeout(() => uploadImage(arr[i], idx), 0);
      });
      return updated;
    });
  }, [images.length, uploadImage]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const { mutate: submit, isPending, isError, error } = useMutation({
    mutationFn: (data: Form) => {
      if (!profileData) throw new Error('Profile data not loaded');
      const uploadedImages = images.filter(i => i.uploaded).map(i => i.path);
      
      return apiClient.post('/api/v1/complaints', {
        ...data,
        attachments: uploadedImages,
        propertyId: profileData?.propertyId?._id ?? profileData?.propertyId,
        landlordId: profileData?.landlordId?._id ?? profileData?.landlordId,
        roomId: profileData?.roomId?._id ?? profileData?.roomId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
      router.push('/complaints?raised=1');
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/complaints">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Raise a Complaint</h1>
          <p className="text-sm text-muted-foreground">Describe the issue and we'll notify your landlord</p>
        </div>
      </div>

      {/* Profile error warning */}
      {profileError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Could not load your tenant profile. Please <a href="/login" className="underline font-semibold">log out and log back in</a> to continue.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(d => submit(d))} className="space-y-5">
        {/* Title */}
        <div className="bg-card rounded-xl border p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Water leaking from ceiling in bathroom"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
        </div>

        {/* Category */}
        <div className="bg-card rounded-xl border p-5">
          <label className="text-sm font-semibold text-foreground block mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setValue('category', cat.value as any)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all',
                  category === cat.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-border text-muted-foreground hover:border-border hover:bg-muted'
                )}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="bg-card rounded-xl border p-5">
          <label className="text-sm font-semibold text-foreground block mb-3">
            Priority <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITIES.map(p => (
              <label
                key={p.value}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                  priority === p.value
                    ? p.color.replace('has-[:checked]:', '')
                    : 'border-border hover:bg-muted'
                )}
              >
                <input
                  type="radio"
                  value={p.value}
                  {...register('priority')}
                  className="hidden"
                />
                <div className={cn('h-3.5 w-3.5 rounded-full border-2 flex-shrink-0', priority === p.value ? 'border-current bg-current' : 'border-border')} />
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs opacity-70">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-xl border p-5">
          <label className="text-sm font-semibold text-foreground block mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description')}
            rows={5}
            placeholder="Describe the issue in detail. Include when it started, how often it occurs, and any relevant details..."
            className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            {errors.description
              ? <p className="text-xs text-red-500">{errors.description.message}</p>
              : <span />
            }
            <span className={cn('text-xs', description.length > 900 ? 'text-red-500' : 'text-muted-foreground')}>
              {description.length}/1000
            </span>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-card rounded-xl border p-5">
          <label className="text-sm font-semibold text-foreground block mb-1.5">
            Attach Photos (optional)
          </label>
          <p className="text-xs text-muted-foreground mb-3">Upload up to 5 photos. Drag & drop or click to browse.</p>

          {/* Drop zone */}
          {images.length < 5 && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-border hover:border-indigo-300 hover:bg-muted'
              )}
            >
              <ImagePlus className={cn('h-8 w-8 mx-auto mb-2', dragOver ? 'text-indigo-500' : 'text-muted-foreground')} />
              <p className={cn('text-sm font-medium', dragOver ? 'text-indigo-600' : 'text-muted-foreground')}>
                Drop images here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — max 20MB each</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files && addImages(e.target.files)}
          />

          {/* Preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />

                  {/* Upload overlay */}
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                      <span className="text-xs text-white">Uploading</span>
                    </div>
                  )}

                  {/* Success overlay */}
                  {img.uploaded && (
                    <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  {/* Error overlay */}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                      <p className="text-xs text-white text-center px-1">{img.error}</p>
                    </div>
                  )}

                  {/* Remove button */}
                  {!img.uploading && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeImage(i); }}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {isError && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {(error as any)?.response?.data?.message ?? 'Failed to submit complaint. Please try again.'}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Link href="/complaints" className="flex-1">
            <button type="button" className="w-full h-12 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isPending || images.some(i => i.uploading) || !profileData}
            className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-200"
          >
            {isPending
              ? <><Loader2 className="h-5 w-5 animate-spin" />Submitting...</>
              : images.some(i => i.uploading)
                ? <><Loader2 className="h-5 w-5 animate-spin" />Uploading images...</>
                : <><Send className="h-5 w-5" />Submit Complaint</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
