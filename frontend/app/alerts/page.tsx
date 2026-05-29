'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, XCircle, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/LoadingSkeleton';
import { getAlerts } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toLowerCase();
  const cfg =
    s === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
    s === 'high'     ? 'bg-orange-100 text-orange-800 border-orange-200' :
                       'bg-amber-100 text-amber-800 border-amber-200';
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', cfg)}>
      {severity}
    </span>
  );
}

function AlertRow({ alert, delay }: { alert: any; delay: number }) {
  const sev = alert.severity?.toLowerCase() || 'medium';
  const isHighSev = sev === 'critical' || sev === 'high';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-sm',
        isHighSev
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      )}
    >
      <div className={cn('mt-0.5 rounded-lg p-2 shrink-0', isHighSev ? 'bg-red-100' : 'bg-amber-100')}>
        {isHighSev
          ? <XCircle className="h-4 w-4 text-red-600" />
          : <AlertTriangle className="h-4 w-4 text-amber-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
          <SeverityBadge severity={sev} />
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {alert.type === 'report' ? 'Community' : alert.type === 'batch_pattern' ? 'Batch Pattern' : 'System'}
          </span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{alert.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          {alert.medicine_name && <span>💊 {alert.medicine_name}</span>}
          {alert.batch_number && <span className="font-mono">#{alert.batch_number}</span>}
          <span>{formatDate(alert.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function AlertsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setData(await getAlerts(50));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = data?.summary;
  const alerts: any[] = data?.alerts || [];

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-amber-500" />
              Alert Center
            </h1>
            <p className="text-gray-500 text-sm mt-1">Suspicious patterns, community reports, and counterfeit detections</p>
          </div>
          <button
            onClick={() => { setRefreshing(true); load(); }}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </motion.div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Alerts',       value: summary.total,                                             color: 'text-gray-900' },
              { label: 'Critical / High',    value: (summary.critical || 0) + (summary.high || 0),            color: 'text-red-700'  },
              { label: 'Suspicious Scans',   value: summary.suspiciousVerifications,                          color: 'text-amber-700'},
              { label: 'Community Reports',  value: summary.totalReports,                                     color: 'text-blue-700' },
            ].map(({ label, value, color }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm"
              >
                <p className={cn('text-2xl font-black', color)}>{value ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Alert list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Active Alerts
              {!loading && <span className="text-gray-400 text-sm font-normal ml-1">({alerts.length})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle2 className="mx-auto h-10 w-10 mb-3 text-green-500" />
                <p className="font-medium text-gray-600">No alerts at this time.</p>
                <p className="text-sm mt-1">System is healthy and operating normally.</p>
              </div>
            ) : (
              <AnimatePresence>
                {alerts.map((alert, i) => (
                  <AlertRow key={alert.id} alert={alert} delay={i * 0.04} />
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
