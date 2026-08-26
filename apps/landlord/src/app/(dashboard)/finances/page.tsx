'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, TrendingDown, Receipt, Plus, Trash2,
  Calendar, Building2, Download, Filter, BarChart3, PieChart as PieIcon,
  CheckCircle, AlertTriangle, Loader2, ArrowUpRight, ArrowDownRight,
  Zap, Droplet, Wifi, Flame, FileText, Check, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';

const EXPENSE_CATEGORIES = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'WATER', label: 'Water' },
  { value: 'INTERNET', label: 'Internet / WiFi' },
  { value: 'SOCIETY_CHARGES', label: 'Society Charges' },
  { value: 'REPAIRS', label: 'Repairs & Fixes' },
  { value: 'PAINTING', label: 'Painting' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'APPLIANCES', label: 'Appliances' },
  { value: 'PROPERTY_TAX', label: 'Property Tax' },
  { value: 'OTHER', label: 'Other' },
];

const UTILITY_TYPES = [
  { value: 'ELECTRICITY', label: 'Electricity', icon: Zap },
  { value: 'WATER', label: 'Water', icon: Droplet },
  { value: 'INTERNET', label: 'Internet / WiFi', icon: Wifi },
  { value: 'GAS', label: 'Gas / PNG', icon: Flame },
  { value: 'OTHER', label: 'Other Utility', icon: FileText },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
const CHART_TOOLTIP = { backgroundColor: '#1e1b4b', border: '1px solid #312e81', borderRadius: '8px', color: '#fff', fontSize: '12px' };

export default function LandlordFinancesPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'utilities' | 'property' | 'reports'>('overview');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showIssueUtility, setShowIssueUtility] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterUtilityType, setFilterUtilityType] = useState<string>('');
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    propertyId: '',
    category: 'MAINTENANCE',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: '',
    isRecurring: false,
  });

  // Utility Bill Form State
  const [utilityForm, setUtilityForm] = useState({
    propertyId: '',
    tenantId: '',
    type: 'ELECTRICITY',
    amount: '',
    billingPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  // Queries
  const { data: overviewData, isLoading: loadingOverview } = useQuery({
    queryKey: ['finances-overview'],
    queryFn: () => apiClient.get('/api/v1/finances/overview').then(r => r.data.data),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-list'],
    queryFn: () => apiClient.get('/api/v1/properties').then(r => r.data.data),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-list-all'],
    queryFn: () => apiClient.get('/api/v1/tenants', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['finances-expenses', selectedPropertyId, filterCategory],
    queryFn: () =>
      apiClient
        .get('/api/v1/finances/expenses', {
          params: {
            propertyId: selectedPropertyId || undefined,
            category: filterCategory || undefined,
            limit: 50,
          },
        })
        .then(r => r.data),
  });

  const { data: utilitiesData, isLoading: loadingUtilities } = useQuery({
    queryKey: ['finances-utilities', selectedPropertyId, filterUtilityType],
    queryFn: () =>
      apiClient
        .get('/api/v1/utilities', {
          params: {
            propertyId: selectedPropertyId || undefined,
            type: filterUtilityType || undefined,
            limit: 50,
          },
        })
        .then(r => r.data),
  });

  const { data: propFinanceData, isLoading: loadingPropFinance } = useQuery({
    queryKey: ['property-finances', selectedPropertyId],
    queryFn: () =>
      apiClient.get(`/api/v1/finances/properties/${selectedPropertyId}`).then(r => r.data.data),
    enabled: !!selectedPropertyId,
  });

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['finances-reports', reportYear],
    queryFn: () =>
      apiClient.get('/api/v1/finances/reports', { params: { year: reportYear } }).then(r => r.data.data),
  });

  // Mutations
  const { mutate: createExpense, isPending: creatingExpense } = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/finances/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finances-expenses'] });
      qc.invalidateQueries({ queryKey: ['finances-overview'] });
      qc.invalidateQueries({ queryKey: ['finances-reports'] });
      setShowAddExpense(false);
      setExpenseForm({
        propertyId: '',
        category: 'MAINTENANCE',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receiptUrl: '',
        isRecurring: false,
      });
    },
  });

  const { mutate: issueUtilityBill, isPending: issuingBill } = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/utilities', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finances-utilities'] });
      setShowIssueUtility(false);
      setUtilityForm({
        propertyId: '',
        tenantId: '',
        type: 'ELECTRICITY',
        amount: '',
        billingPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
    },
  });

  const { mutate: updateUtilityStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/api/v1/utilities/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finances-utilities'] });
    },
  });

  const { mutate: deleteExpense } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/finances/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finances-expenses'] });
      qc.invalidateQueries({ queryKey: ['finances-overview'] });
    },
  });

  const { mutate: deleteUtilityBill } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/utilities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finances-utilities'] });
    },
  });

  const handleExportCSV = () => {
    if (!reportsData?.monthlyReports) return;
    const headers = ['Month', 'Total Due (INR)', 'Collected Income (INR)', 'Pending (INR)', 'Expenses (INR)', 'Net Income (INR)', 'Collection Rate (%)'];
    const rows = reportsData.monthlyReports.map((r: any) => [
      r.month,
      r.totalDue,
      r.collectedIncome,
      r.pendingAmount,
      r.expenses,
      r.netIncome,
      `${r.collectionRate}%`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RentFlow_Financial_Report_${reportYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = overviewData?.portfolioSummary ?? {};
  const cashflow = overviewData?.cashflowChart ?? [];
  const categoryExp = overviewData?.expensesByCategory ?? [];
  const properties = propertiesData ?? [];
  const tenants = tenantsData ?? [];
  const expensesList = expensesData?.data ?? [];
  const utilitiesList = utilitiesData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Intelligence & Accounting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cashflow analytics, expense tracking, and utility billing management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowIssueUtility(true)}
            variant="outline"
            className="gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
          >
            <Zap className="h-4 w-4 text-amber-500" /> Issue Utility Bill
          </Button>
          <Button
            onClick={() => setShowAddExpense(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Record Expense
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-medium overflow-x-auto">
        {[
          { key: 'overview', label: 'Portfolio Overview', icon: BarChart3 },
          { key: 'expenses', label: 'Expenses Tracker', icon: Receipt },
          { key: 'utilities', label: 'Utility Billing', icon: Zap },
          { key: 'property', label: 'Property Intelligence', icon: Building2 },
          { key: 'reports', label: 'Accounting Reports', icon: Download },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={cn(
              'flex items-center gap-2 pb-3 border-b-2 transition-all whitespace-nowrap',
              activeTab === key
                ? 'border-indigo-600 text-indigo-600 font-semibold dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── 1. PORTFOLIO OVERVIEW TAB ───────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Collected Rent (This Month)</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(summary.collectedMonthlyRent ?? 0)}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {summary.collectionRate ?? 0}% collection rate
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(summary.monthlyExpenses ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Maintenance & utilities</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Net Monthly Cashflow</p>
                    <p className={cn('text-2xl font-bold mt-1', (summary.netMonthlyIncome ?? 0) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500')}>
                      {formatCurrency(summary.netMonthlyIncome ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Gross collected minus expenses</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{summary.occupancyRate ?? 0}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.occupiedUnits ?? 0} / {summary.totalUnits ?? 0} units occupied
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Income vs Expenses Cashflow */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Cashflow Analysis — Last 6 Months</CardTitle>
                <CardDescription>Comparison of collected rental income vs operating expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cashflow}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="income" name="Rental Income" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Operating Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Expense Distribution</CardTitle>
                <CardDescription>Breakdown by category this month</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryExp.length === 0 ? (
                  <EmptyState icon={Receipt} title="No expenses recorded" description="Record property expenses to view breakdowns." compact />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={categoryExp} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="total" paddingAngle={3}>
                          {categoryExp.map((_: any, index: number) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {categoryExp.map((c: any, index: number) => (
                        <div key={c.category} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-muted-foreground">{c.category.replace(/_/g, ' ')}</span>
                          </div>
                          <span className="font-semibold text-foreground">{formatCurrency(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── 2. EXPENSES TRACKER TAB ─────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl border">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-48">
                <select
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">All Properties</option>
                  {properties.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-48">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">All Categories</option>
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button onClick={() => setShowAddExpense(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Property</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Description</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expensesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                        No expenses recorded matching filters.
                      </td>
                    </tr>
                  ) : (
                    expensesList.map((exp: any) => (
                      <tr key={exp._id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-5 py-3.5 text-foreground whitespace-nowrap">{formatDate(exp.date)}</td>
                        <td className="px-5 py-3.5 font-medium text-foreground">{exp.propertyId?.name ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {exp.category?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground max-w-xs truncate">{exp.description || '—'}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-foreground">{formatCurrency(exp.amount)}</td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Delete this expense entry?')) deleteExpense(exp._id);
                            }}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── 3. UTILITY BILLING TAB ──────────────────────────── */}
      {activeTab === 'utilities' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl border">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-48">
                <select
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">All Properties</option>
                  {properties.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-48">
                <select
                  value={filterUtilityType}
                  onChange={e => setFilterUtilityType(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">All Utility Types</option>
                  {UTILITY_TYPES.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button onClick={() => setShowIssueUtility(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
              <Zap className="h-4 w-4 text-amber-300" /> Issue Utility Bill
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Property / Tenant</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Billing Period</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Due Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {utilitiesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                        No utility bills issued matching filters.
                      </td>
                    </tr>
                  ) : (
                    utilitiesList.map((bill: any) => {
                      const isOverdue = bill.status === 'OVERDUE' || (bill.status === 'PENDING' && new Date(bill.dueDate) < new Date());
                      const isPaid = bill.status === 'PAID';
                      return (
                        <tr key={bill._id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-foreground">
                              {bill.type === 'ELECTRICITY' && <Zap className="h-3.5 w-3.5 text-amber-500" />}
                              {bill.type === 'WATER' && <Droplet className="h-3.5 w-3.5 text-blue-500" />}
                              {bill.type === 'INTERNET' && <Wifi className="h-3.5 w-3.5 text-indigo-500" />}
                              {bill.type === 'GAS' && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                              {bill.type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-foreground">{bill.propertyId?.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {bill.tenantId ? `${bill.tenantId.userId?.firstName || ''} ${bill.tenantId.userId?.lastName || ''}` : 'All Property Tenants'}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-foreground">{bill.billingPeriod}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{formatDate(bill.dueDate)}</td>
                          <td className="px-5 py-3.5 text-right font-bold text-foreground">{formatCurrency(bill.amount)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
                              isPaid
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700'
                                : isOverdue
                                ? 'bg-red-100 dark:bg-red-950/50 text-red-700'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700',
                            )}>
                              {isPaid ? <CheckCircle className="h-3 w-3" /> : isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {!isPaid && (
                                <button
                                  onClick={() => updateUtilityStatus({ id: bill._id, status: 'PAID' })}
                                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                                >
                                  Mark Paid
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm('Delete this utility bill?')) deleteUtilityBill(bill._id);
                                }}
                                className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── 4. PROPERTY INTELLIGENCE TAB ────────────────────── */}
      {activeTab === 'property' && (
        <div className="space-y-6">
          <div className="w-72">
            <Label className="mb-1.5 block text-xs">Select Property</Label>
            <select
              value={selectedPropertyId}
              onChange={e => setSelectedPropertyId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm font-medium"
            >
              <option value="">Select a property...</option>
              {properties.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {!selectedPropertyId ? (
            <EmptyState icon={Building2} title="Select a property" description="Choose a property from the dropdown above to inspect financial performance metrics." />
          ) : loadingPropFinance ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : propFinanceData ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">Rent Collected (This Month)</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(propFinanceData.metrics?.rentCollectedThisMonth ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Expected: {formatCurrency(propFinanceData.metrics?.expectedRentThisMonth ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(propFinanceData.metrics?.monthlyExpenses ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">YTD: {formatCurrency(propFinanceData.metrics?.ytdExpenses ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">Net Monthly Income</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(propFinanceData.metrics?.netMonthlyIncome ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Gross collected - expenses</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">Vacancy Loss Estimate</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(propFinanceData.metrics?.estimatedVacancyLoss ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{propFinanceData.property?.vacantBeds ?? 0} vacant unit(s)</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Financial Health Summary — {propFinanceData.property?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3 text-sm">
                    <div className="p-4 rounded-xl bg-muted/40 border">
                      <p className="text-muted-foreground text-xs">All-Time Rent Collected</p>
                      <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(propFinanceData.metrics?.totalCollectedAllTime ?? 0)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border">
                      <p className="text-muted-foreground text-xs">Overdue Rent Balances</p>
                      <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(propFinanceData.metrics?.totalOverdueRent ?? 0)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border">
                      <p className="text-muted-foreground text-xs">Estimated Annualized Run-rate</p>
                      <p className="text-xl font-bold text-indigo-600 mt-1">{formatCurrency(propFinanceData.metrics?.estimatedAnnualRevenue ?? 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* ── 5. ACCOUNTING REPORTS TAB ───────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-semibold">Financial Year:</Label>
              <select
                value={reportYear}
                onChange={e => setReportYear(+e.target.value)}
                className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-semibold"
              >
                {[2026, 2025, 2024].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Export CSV Statement
            </Button>
          </div>

          {reportsData && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Total Annual Revenue ({reportYear})</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{formatCurrency(reportsData.annualSummary?.totalAnnualIncome ?? 0)}</p>
              </div>
              <div className="p-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">Total Operating Expenses ({reportYear})</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{formatCurrency(reportsData.annualSummary?.totalAnnualExpenses ?? 0)}</p>
              </div>
              <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Net Rental Income ({reportYear})</p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(reportsData.annualSummary?.netAnnualIncome ?? 0)}
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Income & Expense Statement</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Month</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Billed Rent</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Collected Income</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Pending Rent</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Expenses</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Net Income</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Collection %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(reportsData?.monthlyReports ?? []).map((m: any) => (
                    <tr key={m.month} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-foreground">{m.month}</td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">{formatCurrency(m.totalDue)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">{formatCurrency(m.collectedIncome)}</td>
                      <td className="px-5 py-3.5 text-right text-yellow-600">{formatCurrency(m.pendingAmount)}</td>
                      <td className="px-5 py-3.5 text-right text-red-600">{formatCurrency(m.expenses)}</td>
                      <td className={cn('px-5 py-3.5 text-right font-bold', m.netIncome >= 0 ? 'text-indigo-600' : 'text-red-600')}>
                        {formatCurrency(m.netIncome)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-foreground">{m.collectionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── RECORD EXPENSE MODAL ────────────────────────────── */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Record Property Expense</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Track maintenance, bills, and operating costs</p>
              </div>
              <button onClick={() => setShowAddExpense(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                createExpense({
                  ...expenseForm,
                  amount: +expenseForm.amount,
                });
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Property <span className="text-red-500">*</span></Label>
                <select
                  required
                  value={expenseForm.propertyId}
                  onChange={e => setExpenseForm(prev => ({ ...prev, propertyId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Select property...</option>
                  {properties.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 2500"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description / Note (Optional)</Label>
                <Input
                  placeholder="e.g. Electrician visit for Room 102 switchboard"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={expenseForm.isRecurring}
                  onChange={e => setExpenseForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="rounded border-border text-indigo-600"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer text-foreground">
                  Recurring Monthly Expense
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowAddExpense(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingExpense} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {creatingExpense ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving...</> : 'Save Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ISSUE UTILITY BILL MODAL ─────────────────────────── */}
      {showIssueUtility && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" /> Issue Utility Bill
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Bill electricity, water, or WiFi to properties and residents</p>
              </div>
              <button onClick={() => setShowIssueUtility(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                issueUtilityBill({
                  ...utilityForm,
                  amount: +utilityForm.amount,
                  tenantId: utilityForm.tenantId || undefined,
                });
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Property <span className="text-red-500">*</span></Label>
                <select
                  required
                  value={utilityForm.propertyId}
                  onChange={e => setUtilityForm(prev => ({ ...prev, propertyId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Select property...</option>
                  {properties.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Assign to Tenant (Optional — leave blank for property-wide)</Label>
                <select
                  value={utilityForm.tenantId}
                  onChange={e => setUtilityForm(prev => ({ ...prev, tenantId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">All Tenants on Property</option>
                  {tenants
                    .filter((t: any) => !utilityForm.propertyId || t.propertyId?._id === utilityForm.propertyId)
                    .map((t: any) => (
                      <option key={t._id} value={t._id}>
                        {t.userId?.firstName} {t.userId?.lastName} ({t.propertyId?.name} · Room {t.roomId?.roomNumber || '—'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Utility Type</Label>
                  <select
                    value={utilityForm.type}
                    onChange={e => setUtilityForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  >
                    {UTILITY_TYPES.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 1250"
                    value={utilityForm.amount}
                    onChange={e => setUtilityForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Billing Period</Label>
                  <Input
                    required
                    placeholder="e.g. August 2026"
                    value={utilityForm.billingPeriod}
                    onChange={e => setUtilityForm(prev => ({ ...prev, billingPeriod: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Payment Due Date</Label>
                  <Input
                    required
                    type="date"
                    value={utilityForm.dueDate}
                    onChange={e => setUtilityForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes / Meter Reading (Optional)</Label>
                <Input
                  placeholder="e.g. Sub-meter reading: 342 units @ ₹8/unit"
                  value={utilityForm.notes}
                  onChange={e => setUtilityForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowIssueUtility(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={issuingBill} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                  {issuingBill ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Issuing...</> : <><Zap className="h-4 w-4" /> Issue Bill & Notify Tenant</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
