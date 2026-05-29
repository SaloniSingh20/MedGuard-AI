'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowLeft,
  Pill, Hash, Building2, Calendar, FileText,
  Brain, Loader2, ScanLine, Shield, Database, Cpu,
  CheckCheck, X, Info, Thermometer,
} from 'lucide-react';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/LoadingSkeleton';
import { getVerification } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

const statusConfig = {
  authentic: {
    icon: CheckCircle2,
    label: 'Authentic',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    desc: 'This medicine package passed all authentication checks.',
  },
  suspicious: {
    icon: AlertTriangle,
    label: 'Suspicious',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    desc: 'Some verification signals raised concerns. Consult a pharmacist.',
  },
  counterfeit: {
    icon: XCircle,
    label: 'Counterfeit',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    desc: 'Multiple counterfeit indicators detected. Do not consume.',
  },
};

const FIELD_LABELS: Record<string, string> = {
  medicine_name:  'Medicine Name / Form',
  manufacturer:   'Manufacturer',
  batch_number:   'Batch Number',
  expiry_date:    'Expiry Date',
  mfg_date:       'Manufacturing Date',
  dosage:         'Dosage Strength',
  composition:    'Active Composition',
  storage:        'Storage Instructions',
  regulatory:     'Regulatory Reference (IP/BP/USP)',
  country_origin: 'Country of Origin',
};

function FieldCheck({ label, present }: { label: string; present: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg px-3 py-2 text-xs border',
      present
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-700'
    )}>
      {present
        ? <CheckCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />
        : <X          className="h-3.5 w-3.5 shrink-0 text-red-500" />}
      <span className="font-medium">{label}</span>
    </div>
  );
}

function MetaField({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-gray-100 border border-gray-200 p-2">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-gray-900 font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function DBBadge({ label, score, valid }: { label: string; score: number; valid: boolean }) {
  const color = valid
    ? (score >= 80 ? 'text-green-700' : 'text-amber-700')
    : 'text-red-700';
  const bg = valid
    ? (score >= 80 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200')
    : 'bg-red-50 border-red-200';
  return (
    <div className={cn('flex items-center justify-between rounded-lg border px-3 py-2', bg)}>
      <span className="text-xs text-gray-700 font-medium">{label}</span>
      <span className={cn('text-xs font-bold', color)}>
        {valid ? `${score}%` : 'Not found'}
      </span>
    </div>
  );
}

export default function ResultPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getVerification(id as string)
      .then(res  => { setData(res);        setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
          <div className="flex items-center justify-center gap-3 text-gray-500 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Loading verification result…
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3 shadow-sm">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 text-center space-y-4">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">Result not found</h2>
          <p className="text-gray-500">{error || 'This verification does not exist.'}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
            <Button onClick={() => router.push('/verify')}>
              <ScanLine className="h-4 w-4" /> New Scan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const v            = data.verification;
  const status       = (v.status || 'suspicious') as 'authentic' | 'suspicious' | 'counterfeit';
  const cfg          = statusConfig[status] ?? statusConfig.suspicious;
  const StatusIcon   = cfg.icon;
  const ai           = v.ai_result || {};
  const evidence     = ai.evidence || {};
  const anomalies: string[]            = ai.detected_issues || v.anomalies || [];
  const fieldsFound: Record<string, boolean> = ai.fields_found || evidence.fieldsPresent || {};
  const dbValidation = evidence.mfrValidation  || {};
  const batchVal     = evidence.batchValidation || {};
  const expiryVal    = evidence.expiryValidation || {};
  const extracted    = {
    name:         v.medicine_name || '',
    batch:        evidence.extractedBatch        || v.batch_number || '',
    manufacturer: evidence.extractedManufacturer || '',
    expiry:       evidence.extractedExpiry        || '',
    dosage:       evidence.extractedDosage        || '',
  };
  const ocrMethod  = evidence.ocrMethod      || '';
  const ocrConf    = evidence.ocrConfidence  ?? null;
  const fieldCount = evidence.fieldCount ?? Object.values(fieldsFound).filter(Boolean).length;
  const redFlags: string[] = evidence.redFlags || [];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">

        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </motion.div>

        {/* ── Verdict Card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={cn('border-2', cfg.bg)}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                {/* Status icon */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className={cn('rounded-full p-4 border', cfg.bg)}>
                    <StatusIcon className={cn('h-10 w-10', cfg.color)} />
                  </div>
                  <p className={cn('text-2xl font-black', cfg.color)}>{cfg.label}</p>
                  <Badge variant={status === 'authentic' ? 'success' : status === 'counterfeit' ? 'destructive' : 'warning'}>
                    {status.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-gray-500 text-center max-w-[160px] mt-1 leading-relaxed">{cfg.desc}</p>
                </div>

                {/* Confidence meter */}
                <div className="flex-1 w-full">
                  <ConfidenceMeter score={v.authenticity_score} status={status} />
                </div>

                {/* Quick facts */}
                <div className="space-y-3 text-sm min-w-[160px]">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Medicine</p>
                    <p className="text-gray-900 font-semibold mt-0.5">{v.medicine_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Batch</p>
                    <p className="text-gray-700 font-mono text-xs mt-0.5">{v.batch_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Scanned</p>
                    <p className="text-gray-600 text-xs mt-0.5">{formatDate(v.timestamp)}</p>
                  </div>
                  {fieldCount > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Fields</p>
                      <p className={cn('text-xs font-bold mt-0.5',
                        fieldCount >= 7 ? 'text-green-700' : fieldCount >= 4 ? 'text-amber-700' : 'text-red-700'
                      )}>{fieldCount}/10 detected</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── AI Reasoning ── */}
        {ai.reason && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  AI Reasoning
                  {ocrMethod && (
                    <span className="ml-auto text-xs font-normal text-gray-400 flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      {ocrMethod === 'demo-fallback' ? 'Demo mode' : `OCR: ${ocrMethod}`}
                      {ocrConf !== null && ocrConf > 0 && ` (${ocrConf}% conf)`}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">{ai.reason}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Authentication Field Checklist ── */}
        {Object.keys(fieldsFound).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Authentication Checklist
                  <span className="ml-auto text-xs font-normal text-gray-400">
                    {Object.values(fieldsFound).filter(Boolean).length}/{Object.keys(fieldsFound).length} fields found
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(fieldsFound).map(([key, val]) => (
                    <FieldCheck key={key} label={FIELD_LABELS[key] || key.replace(/_/g, ' ')} present={Boolean(val)} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Detected Issues ── */}
        {(anomalies.length > 0 || redFlags.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Issues Detected ({anomalies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {anomalies.map((a, i) => (
                    <Badge key={i} variant={redFlags.includes(a) ? 'destructive' : 'warning'}>{a}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Database Validation ── */}
        {(dbValidation.score !== undefined || batchVal.score !== undefined) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Database Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {dbValidation.score !== undefined && (
                    <DBBadge label="Manufacturer" score={dbValidation.score} valid={dbValidation.valid ?? false} />
                  )}
                  {batchVal.score !== undefined && (
                    <DBBadge label="Batch Format" score={batchVal.score}    valid={batchVal.valid ?? false} />
                  )}
                  {expiryVal.score !== undefined && (
                    <DBBadge label="Expiry Date"  score={expiryVal.score}   valid={expiryVal.valid ?? false} />
                  )}
                </div>
                {dbValidation.name && (
                  <p className="mt-3 text-xs text-green-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Recognized: {dbValidation.name}
                  </p>
                )}
                {expiryVal.expired && (
                  <p className="mt-2 text-xs text-red-700 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Warning: Product is past its expiry date
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Extracted Packaging Data ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Extracted Packaging Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {extracted.name         && <MetaField icon={Pill}      label="Medicine"      value={extracted.name}         />}
                {extracted.batch        && <MetaField icon={Hash}      label="Batch Number"  value={extracted.batch}        />}
                {extracted.manufacturer && <MetaField icon={Building2} label="Manufacturer"  value={extracted.manufacturer} />}
                {extracted.expiry       && <MetaField icon={Calendar}  label="Expiry Date"   value={extracted.expiry}       />}
                {extracted.dosage       && <MetaField icon={Thermometer} label="Dosage"      value={extracted.dosage}       />}
              </div>

              {!Object.values(extracted).some(Boolean) && (
                <div className="flex items-start gap-2 text-sm text-gray-500 py-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                  <p>No structured fields parsed from the extracted text. Raw OCR text shown below.</p>
                </div>
              )}

              {v.extracted_text && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-700 select-none font-medium">
                    View raw OCR text ({v.extracted_text.length} chars)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-52 whitespace-pre-wrap leading-relaxed font-mono">
                    {v.extracted_text}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Actions ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 pb-6">
          <Button onClick={() => router.push('/verify')} className="flex-1">
            <ScanLine className="h-4 w-4" /> Verify Another
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
            View Dashboard
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
