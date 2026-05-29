'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ScanLine, ShieldAlert, FileWarning, Activity, CheckCircle,
  AlertTriangle, XCircle, RefreshCw,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCardSkeleton, Skeleton } from '@/components/LoadingSkeleton';
import { getAdminStats, getAnalytics, getRecentVerifications } from '@/lib/api';
import { cn, formatDate, getStatusBg } from '@/lib/utils';

const PIE_COLORS = { Authentic: '#16a34a', Suspicious: '#d97706', Counterfeit: '#dc2626' };
const BAR_COLORS = { authentic: '#16a34a', suspicious: '#d97706', counterfeit: '#dc2626' };

function VerdictBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || 'suspicious';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', getStatusBg(s))}>
      {s === 'authentic'   && <CheckCircle  className="h-3 w-3" />}
      {s === 'suspicious'  && <AlertTriangle className="h-3 w-3" />}
      {s === 'counterfeit' && <XCircle       className="h-3 w-3" />}
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  fontSize: '12px',
};
const TOOLTIP_LABEL_STYLE = { color: '#111827', fontWeight: 600 };

export default function DashboardPage() {
  const [stats,     setStats]     = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recent,    setRecent]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const loadData = async () => {
    try {
      const [s, a, r] = await Promise.all([
        getAdminStats(),
        getAnalytics(),
        getRecentVerifications(8),
      ]);
      setStats(s); setAnalytics(a); setRecent(r.logs || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time verification metrics and trends</p>
          </div>
          <button
            onClick={() => { setRefreshing(true); loadData(); }}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {loading ? (
            [...Array(3)].map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard title="Total Verifications" value={stats?.totalVerifications ?? 0}  subtitle="All time"       icon={ScanLine}    color="blue"    delay={0}   />
              <StatCard title="Counterfeit Detected" value={stats?.counterfeitDetected ?? 0} subtitle="Blocked threats" icon={ShieldAlert}  color="red"     delay={0.1} />
              <StatCard title="Reports Submitted"    value={stats?.reportsSubmitted ?? 0}    subtitle="From community"  icon={FileWarning}  color="amber"   delay={0.2} />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Weekly bar chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Weekly Scan Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-64 w-full" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics?.weeklyScans || []} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                      <Bar dataKey="authentic"   name="Authentic"   fill={BAR_COLORS.authentic}   radius={[4,4,0,0]} />
                      <Bar dataKey="suspicious"  name="Suspicious"  fill={BAR_COLORS.suspicious}  radius={[4,4,0,0]} />
                      <Bar dataKey="counterfeit" name="Counterfeit" fill={BAR_COLORS.counterfeit} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Detection Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-64 w-full" /> : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={analytics?.detectionDistribution || []}
                        cx="50%" cy="50%" outerRadius={90} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {(analytics?.detectionDistribution || []).map((entry: any) => (
                          <Cell key={entry.name} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent verifications table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Verifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 text-left font-semibold">Medicine</th>
                      <th className="px-6 py-3 text-left font-semibold">Batch</th>
                      <th className="px-6 py-3 text-left font-semibold">Verdict</th>
                      <th className="px-6 py-3 text-left font-semibold">Score</th>
                      <th className="px-6 py-3 text-left font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          {[...Array(5)].map((_, j) => (
                            <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : recent.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                          No verifications yet.{' '}
                          <a href="/verify" className="text-blue-600 hover:underline font-medium">Run your first scan →</a>
                        </td>
                      </tr>
                    ) : (
                      recent.map((v: any) => (
                        <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-gray-900 font-medium">{v.medicine_name}</td>
                          <td className="px-6 py-3 text-gray-500 font-mono text-xs">{v.batch_number}</td>
                          <td className="px-6 py-3"><VerdictBadge status={v.status} /></td>
                          <td className="px-6 py-3">
                            <span className={cn('font-semibold', v.authenticity_score >= 70 ? 'text-green-700' : v.authenticity_score >= 40 ? 'text-amber-700' : 'text-red-700')}>
                              {v.authenticity_score}%
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(v.timestamp)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
