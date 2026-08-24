'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload, AlertTriangle, CheckCircle, XCircle, FileText,
  MessageSquare, Send, Loader2, ChevronDown, ChevronUp,
  Zap, Scale, X, RefreshCw, BookOpen, ShieldCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalysisClause {
  id: string;
  title: string;
  originalText: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issue: string;
  suggestion: string;
  legalReference?: string;
}

interface AnalysisResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  clauses: AnalysisClause[];
  positives: string[];
  keyTerms: Record<string, string>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const SEV = {
  LOW:      { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', Icon: CheckCircle },
  MEDIUM:   { text: 'text-yellow-700 dark:text-yellow-400',  bg: 'bg-yellow-50 dark:bg-yellow-900/20',  border: 'border-yellow-200 dark:border-yellow-800',  badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',  Icon: AlertTriangle },
  HIGH:     { text: 'text-orange-700 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-900/20',  border: 'border-orange-200 dark:border-orange-800',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',  Icon: AlertTriangle },
  CRITICAL: { text: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',       Icon: XCircle },
};

const RISK_COLORS = {
  LOW:      { ring: 'stroke-emerald-500', text: 'text-emerald-600', label: 'Low Risk' },
  MEDIUM:   { ring: 'stroke-yellow-500',  text: 'text-yellow-600',  label: 'Medium Risk' },
  HIGH:     { ring: 'stroke-orange-500',  text: 'text-orange-600',  label: 'High Risk' },
  CRITICAL: { ring: 'stroke-red-500',     text: 'text-red-600',     label: 'Critical Risk' },
};

// ─── Risk Meter ───────────────────────────────────────────────────────────────
function RiskMeter({ score, level }: { score: number; level: string }) {
  const cfg = RISK_COLORS[level as keyof typeof RISK_COLORS] ?? RISK_COLORS.MEDIUM;
  const circumference = 2 * Math.PI * 40; // r=40
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            className={cfg.ring}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>
      <p className={`mt-2 text-base font-bold ${cfg.text}`}>{cfg.label}</p>
    </div>
  );
}

// ─── Clause Card ──────────────────────────────────────────────────────────────
function ClauseCard({ clause }: { clause: AnalysisClause }) {
  const [open, setOpen] = useState(false);
  const s = SEV[clause.severity] ?? SEV.MEDIUM;
  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 p-4 text-left">
        <s.Icon className={`h-5 w-5 ${s.text} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${s.text}`}>{clause.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{clause.issue}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${s.badge}`}>{clause.severity}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {clause.originalText && (
            <div className="bg-white/70 dark:bg-white/5 rounded-xl p-3 border border-white/60 dark:border-white/10">
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Original Text</p>
              <p className="text-sm text-foreground italic">&#8220;{clause.originalText}&#8221;</p>
            </div>
          )}
          <div className="bg-white/70 dark:bg-white/5 rounded-xl p-3 border border-white/60 dark:border-white/10">
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Problem</p>
            <p className="text-sm text-foreground">{clause.issue}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/50">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-wider">✦ Suggested Alternative</p>
            <p className="text-sm text-emerald-800 dark:text-emerald-200">{clause.suggestion}</p>
          </div>
          {clause.legalReference && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
              {clause.legalReference}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeaseAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.includes('pdf') && !f.type.startsWith('image/')) {
      setError('Please upload a PDF or image file'); return;
    }
    if (f.size > 20 * 1024 * 1024) { setError('Max file size is 20 MB'); return; }
    setFile(f); setError(''); setResult(null); setChat([]);
  }, []);

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/analyze-lease', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.data);
      setChat([{
        role: 'assistant',
        content: `I've analyzed your lease. Risk score: ${data.data.riskScore}/100 (${data.data.riskLevel} risk). Found ${data.data.clauses?.length ?? 0} clause(s) to review. Ask me anything!`,
      }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    } catch (e: any) {
      setError(e?.message ?? 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const sendChat = async () => {
    if (!input.trim() || chatLoading) return;
    const msg = input.trim(); setInput('');
    setChat((prev) => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const fd = new FormData();
      fd.append('message', msg);
      fd.append('history', JSON.stringify(chat));
      const res = await fetch('/api/analyze-lease', { method: 'POST', body: fd });
      const data = await res.json();
      setChat((prev) => [...prev, { role: 'assistant', content: data.message ?? 'Sorry, I could not process that.' }]);
    } catch {
      setChat((prev) => [...prev, { role: 'assistant', content: 'Error processing your request. Please try again.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Lease Analyzer</h1>
            <p className="text-sm text-muted-foreground">Powered by Google Gemini · Detects risky clauses in rental agreements</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Risky clause detection', 'Plain English explanations', 'Better alternatives', 'Indian law references', 'Interactive chatbot'].map((t) => (
            <span key={t} className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 font-medium dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">{t}</span>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left: upload + results */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`relative border-2 border-dashed rounded-3xl transition-all duration-200 ${
              dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]' :
              file ? 'border-indigo-300 bg-indigo-50/40 dark:bg-indigo-900/10' :
              'border-border bg-muted hover:border-indigo-300 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/20 cursor-pointer'
            }`}
            onClick={() => { if (!file) fileRef.current?.click(); }}
          >
            <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <div className="p-8 text-center">
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setChat([]); }}
                      className="ml-auto p-2 rounded-xl hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {!result ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); analyze(); }}
                      disabled={analyzing}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-60 hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 30px rgba(79,70,229,0.35)' }}
                    >
                      {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with Gemini AI...</> : <><Zap className="h-4 w-4" /> Analyze Lease Agreement</>}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                    >
                      <RefreshCw className="h-4 w-4" /> Analyze a different document
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/40">
                    <Upload className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">Drop your lease agreement here</p>
                  <p className="text-sm text-muted-foreground mb-4">PDF or image · Up to 20 MB · Analyzed by Gemini AI</p>
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    <Upload className="h-4 w-4" /> Choose File
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-300 hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5">
              {/* Risk overview */}
              <div className="bg-card rounded-3xl border p-6 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  <RiskMeter score={result.riskScore} level={result.riskLevel} />
                  <div className="sm:col-span-2 space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-2">Analysis Summary</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">{result.summary}</p>
                    </div>
                    {Object.entries(result.keyTerms ?? {}).filter(([, v]) => v).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.keyTerms).filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} className="text-xs bg-muted border border-border rounded-xl px-3 py-2">
                            <span className="text-muted-foreground">{k.replace(/([A-Z])/g, ' $1').trim()}: </span>
                            <span className="font-semibold text-foreground">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Positives */}
              {result.positives?.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 p-5">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Good Clauses Found
                  </h3>
                  <ul className="space-y-2">
                    {result.positives.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Problematic clauses */}
              {result.clauses?.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    {result.clauses.length} Clause{result.clauses.length !== 1 ? 's' : ''} Need Attention
                  </h3>
                  {result.clauses.map((c) => <ClauseCard key={c.id} clause={c} />)}
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 p-10 text-center">
                  <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">No major issues found!</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2">This agreement appears to be fair. Still, ask me any questions below.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: AI Chatbot */}
        <div className="w-96 flex-shrink-0 sticky top-4">
          <div
            className="bg-card rounded-3xl border shadow-sm overflow-hidden flex flex-col"
            style={{ height: 'calc(100vh - 140px)', maxHeight: '700px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b bg-indigo-50/50 dark:bg-indigo-950/20">
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Lease Assistant</p>
                <p className="text-xs text-muted-foreground">Powered by Gemini AI</p>
              </div>
              <div className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.length === 0 && (
                <div className="text-center py-10">
                  <div className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/40">
                    <Scale className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Lease Assistant ready</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                    Upload and analyze your lease above, then ask me anything about your agreement.
                  </p>
                  <div className="space-y-2">
                    {['What is the lock-in period?', 'Can the landlord enter without notice?', 'What happens to my security deposit?'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="block w-full text-left text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2.5 rounded-xl transition-colors font-medium dark:text-indigo-300 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'text-white'
                        : 'bg-muted text-foreground'
                    }`}
                    style={m.role === 'user' ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-muted">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder={result ? 'Ask about your lease...' : 'Analyze a lease first...'}
                  className="flex-1 h-10 px-4 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-card"
                />
                <button
                  onClick={sendChat}
                  disabled={!input.trim() || chatLoading}
                  className="h-10 w-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
