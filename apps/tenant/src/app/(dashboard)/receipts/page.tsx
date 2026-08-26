'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, CheckCircle, Search, Calendar,
  Building2, CreditCard, ExternalLink, Receipt, Eye,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TenantReceiptsPage() {
  const [searchYear, setSearchYear] = useState<string>('');

  const { data: paymentsRes, isLoading } = useQuery({
    queryKey: ['my-receipts-list'],
    queryFn: () => apiClient.get('/api/v1/payments', { params: { status: 'PAID', limit: 100 } }).then(r => r.data),
  });

  const paidPayments = paymentsRes?.data ?? [];

  const filtered = paidPayments.filter((p: any) => {
    if (searchYear && p.year?.toString() !== searchYear) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rent Payment Receipts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Official verified payment receipts for tax declaration and records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={searchYear}
            onChange={e => setSearchYear(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-card text-sm"
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* Receipts Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verified Tax Receipts</CardTitle>
          <CardDescription>Generated automatically upon landlord payment verification</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading receipts...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={FileText}
                title="No receipts found"
                description="Receipts are generated as soon as your monthly rent payment is verified."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Period</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Receipt Number</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Paid Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Amount Paid</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p: any) => (
                    <tr key={p._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {MONTHS[(p.month ?? 1) - 1]} {p.year}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        {p.receipt?.receiptId || `REC-${p._id.substring(18).toUpperCase()}`}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {p.paidAt ? formatDate(p.paidAt) : formatDate(p.updatedAt)}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-foreground">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/payments/${p._id}/receipt`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold text-xs transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
