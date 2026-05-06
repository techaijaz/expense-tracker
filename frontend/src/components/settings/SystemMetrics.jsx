import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart3,
  Database,
  Activity,
  Wallet,
  Tags,
  Users,
  RefreshCcw,
  Calendar,
} from 'lucide-react';
import api from '@/utils/httpMethods';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/utils';

export default function SystemMetrics() {
  const { user } = useSelector((s) => s.auth);
  const currentUser = user?.user;

  // Real-time counts from Redux
  const { categories } = useSelector((s) => s.category);
  const { accounts } = useSelector((s) => s.accounts);

  const catCount = Object.values(categories || {}).reduce(
    (acc, list) => acc + (list?.length || 0),
    0,
  );
  const accCount = accounts?.length || 0;

  const [storageStats, setStorageStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await api.get('/user/storage-stats');
      setStorageStats(statsRes?.data || null);
    } catch (e) {
      console.error('Failed to fetch storage stats');
    }
  }, []);

  useEffect(() => {
    fetchStats();
    window.addEventListener('refetch-system-metrics', fetchStats);
    return () =>
      window.removeEventListener('refetch-system-metrics', fetchStats);
  }, [fetchStats]);

  const formatLargeNum = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const metrics = [
    {
      label: 'Transactions',
      val: formatLargeNum(storageStats?.transactions || 0),
      icon: <Activity className="w-4 h-4" />,
      colorClass: 'text-indigo-500 bg-indigo-500/10',
      key: 'TXNS',
    },
    {
      label: 'Accounts',
      val: accCount,
      icon: <Wallet className="w-4 h-4" />,
      colorClass: 'text-emerald-500 bg-emerald-500/10',
      key: 'ACCOUNTS',
    },
    {
      label: 'Categories',
      val: catCount,
      icon: <Tags className="w-4 h-4" />,
      colorClass: 'text-amber-500 bg-amber-500/10',
      key: 'CATS',
    },
    {
      label: 'Parties',
      val: storageStats?.parties || 0,
      icon: <Users className="w-4 h-4" />,
      colorClass: 'text-purple-500 bg-purple-500/10',
      key: 'PARTIES',
    },
  ];

  const usagePercent = storageStats?.usagePercent ?? 0;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">System Metrics</CardTitle>
            <CardDescription className="text-xs">
              Real-time usage statistics and resource monitoring
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Storage Usage Section */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Storage Usage
              </span>
            </div>
            <span className="text-sm font-black text-slate-800 dark:text-white">
              {usagePercent}%
            </span>
          </div>
          <Progress
            value={usagePercent}
            className="h-2 bg-slate-100 dark:bg-slate-700"
          />
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            Your storage usage reflects the volume of transaction history and
            metadata stored across all ledgers.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div
              key={m.key}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col gap-2"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  m.colorClass,
                )}
              >
                {m.icon}
              </div>
              <div>
                <div className="text-xl font-black text-slate-800 dark:text-white leading-none">
                  {m.val}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {m.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sync Status */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCcw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Last Synchronized
            </span>
          </div>
          <div className="text-[11px] font-bold font-mono text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded-md">
            {currentUser?.lastLoginAt
              ? new Date(currentUser.lastLoginAt)
                  .toISOString()
                  .replace('T', ' ')
                  .substring(0, 19) + ' UTC'
              : 'No sync data available'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
