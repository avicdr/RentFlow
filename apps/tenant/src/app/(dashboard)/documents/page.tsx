'use client';

import { useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Upload, File, Trash2, Download, Eye, Image,
  FileCheck, Loader2, FolderOpen, Plus, X, CheckCircle,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'ALL', label: 'All Documents' },
  { value: 'agreements', label: 'Agreements' },
  { value: 'identity', label: 'Identity / KYC' },
  { value: 'payments', label: 'Payment Proofs' },
  { value: 'complaints', label: 'Complaint Photos' },
  { value: 'misc', label: 'Other' },
];

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadingFile { name: string; progress: number; done: boolean; error: string; }

export default function DocumentsPage() {
  const [category, setCategory] = useState('ALL');
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-documents', category],
    queryFn: () =>
      apiClient.get('/api/v1/documents', {
        params: { category: category === 'ALL' ? undefined : category },
      }).then(r => r.data.data),
  });

  const { mutate: deleteDoc } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-documents'] }),
  });

  const uploadFiles = useCallback(async (files: File[]) => {
    const newItems: UploadingFile[] = files.map(f => ({ name: f.name, progress: 0, done: false, error: '' }));
    setUploading(prev => [...prev, ...newItems]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const idx = uploading.length + i;
      const form = new FormData();
      form.append('file', file);
      form.append('category', category === 'ALL' ? 'misc' : category);

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploading(prev => prev.map((u, j) => j === idx ? { ...u, progress: Math.min(u.progress + 15, 85) } : u));
      }, 200);

      try {
        await apiClient.post('/api/v1/documents/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        clearInterval(progressInterval);
        setUploading(prev => prev.map((u, j) => j === idx ? { ...u, progress: 100, done: true } : u));
        qc.invalidateQueries({ queryKey: ['my-documents'] });
        setTimeout(() => setUploading(prev => prev.filter((_, j) => j !== idx)), 2000);
      } catch {
        clearInterval(progressInterval);
        setUploading(prev => prev.map((u, j) => j === idx ? { ...u, error: 'Upload failed' } : u));
      }
    }
  }, [uploading.length, qc]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(Array.from(e.dataTransfer.files));
  };

  const docs = data ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Document Vault</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{docs.length} document{docs.length !== 1 ? 's' : ''} stored securely</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
        >
          <Plus className="h-4 w-4" /> Upload
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
              category === c.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-card text-muted-foreground border-border hover:border-indigo-300'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all',
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-border hover:border-indigo-300 hover:bg-muted'
        )}
      >
        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0', dragOver ? 'bg-indigo-100' : 'bg-muted')}>
          <Upload className={cn('h-5 w-5', dragOver ? 'text-indigo-500' : 'text-muted-foreground')} />
        </div>
        <div>
          <p className={cn('text-sm font-semibold', dragOver ? 'text-indigo-600' : 'text-muted-foreground')}>
            {dragOver ? 'Drop files here' : 'Drag & drop files or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground">Images and PDFs — max 20MB each</p>
        </div>
      </div>
      <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={e => e.target.files && uploadFiles(Array.from(e.target.files))} />

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 flex items-center gap-3">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', u.done ? 'bg-emerald-100' : u.error ? 'bg-red-100' : 'bg-indigo-100')}>
                {u.done ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : u.error ? <X className="h-4 w-4 text-red-600" /> : <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                {!u.done && !u.error && (
                  <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${u.progress}%` }} />
                  </div>
                )}
                {u.error && <p className="text-xs text-red-500 mt-0.5">{u.error}</p>}
                {u.done && <p className="text-xs text-emerald-600 mt-0.5">Uploaded successfully</p>}
              </div>
              {!u.done && !u.error && <span className="text-xs text-muted-foreground font-mono">{u.progress}%</span>}
            </div>
          ))}
        </div>
      )}

      {/* Document List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No documents found</p>
          <p className="text-sm text-muted-foreground mt-1">Upload your agreements, IDs, and other important documents.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden divide-y">
          {docs.map((doc: any) => {
            const Icon = getFileIcon(doc.mimeType);
            const isImage = doc.mimeType?.startsWith('image/');
            const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${doc.filePath?.split('/uploads/')[1]}`;

            return (
              <div key={doc._id} className="flex items-center gap-4 p-4 hover:bg-muted transition-colors">
                {/* Icon / Thumbnail */}
                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {isImage
                    ? <img src={fileUrl} alt="" className="h-full w-full object-cover" onError={e => { (e.target as any).style.display = 'none'; }} />
                    : <Icon className="h-5 w-5 text-indigo-500" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.originalName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatBytes(doc.sizeBytes)}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full capitalize">{doc.category}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isImage && (
                    <button
                      onClick={() => setPreviewUrl(fileUrl)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-indigo-600 transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <a
                    href={fileUrl}
                    download={doc.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-emerald-600 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => { if (confirm('Delete this document?')) deleteDoc(doc._id); }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl('')}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
            onClick={() => setPreviewUrl('')}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
