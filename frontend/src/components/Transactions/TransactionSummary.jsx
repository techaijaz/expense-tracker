import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import PremiumKpiCard from '@/components/ui/PremiumKpiCard';
import useFormat from '@/hooks/useFormat';

export default function TransactionSummary({
  inflow,
  outflow,
  netPrecision,
  totalRecords,
  overview,
}) {
  const { formatAmount } = useFormat();

  return (
    <div className="flex flex-wrap gap-4 mb-2">
      <PremiumKpiCard
        title="Total Inflow"
        value={formatAmount(inflow)}
        subtitle="Money arriving"
        icon={ArrowDownLeft}
        color="green"
        trend={
          overview?.comparison?.incomeChange !== undefined && inflow > 0
            ? {
                value: `${Math.abs(overview.comparison.incomeChange)}%`,
                direction:
                  overview.comparison.incomeChange >= 0 ? 'up' : 'down',
                label: 'vs last month',
              }
            : null
        }
        delay={100}
        className="flex-1 min-w-[280px] border-slate-900 dark:border-slate-800 shadow-xl"
      />
      <PremiumKpiCard
        title="Total Outflow"
        value={formatAmount(outflow)}
        subtitle="Money leaving"
        icon={ArrowUpRight}
        color="red"
        trend={
          overview?.comparison?.expenseChange !== undefined && outflow > 0
            ? {
                value: `${Math.abs(overview.comparison.expenseChange)}%`,
                direction:
                  overview.comparison.expenseChange <= 0 ? 'up' : 'down',
                label: 'vs last month',
              }
            : null
        }
        delay={200}
        className="flex-1 min-w-[280px] border-slate-900 dark:border-slate-800 shadow-xl"
      />
      <PremiumKpiCard
        title="Net Precision"
        value={`${netPrecision >= 0 ? '+' : ''}${formatAmount(netPrecision)}`}
        subtitle="Net flow summary"
        icon={netPrecision >= 0 ? TrendingUp : TrendingDown}
        color={netPrecision >= 0 ? 'green' : 'red'}
        badge={
          netPrecision !== 0
            ? {
                text: netPrecision >= 0 ? 'Surplus' : 'Deficit',
                variant: netPrecision >= 0 ? 'success' : 'error',
              }
            : null
        }
        trend={
          overview?.comparison?.savingsChange !== undefined &&
          (inflow > 0 || outflow > 0)
            ? {
                value: `${Math.abs(overview.comparison.savingsChange)}%`,
                direction:
                  overview.comparison.savingsChange >= 0 ? 'up' : 'down',
                label: 'vs last month',
              }
            : null
        }
        delay={300}
        className="flex-1 min-w-[280px] border-slate-900 dark:border-slate-800 shadow-xl"
      />
      <PremiumKpiCard
        title="Movements"
        value={totalRecords}
        subtitle="Total recorded activity"
        icon={Activity}
        color="purple"
        delay={300}
        className="flex-1 min-w-[280px] border-slate-900 dark:border-slate-800 shadow-xl"
      />
    </div>
  );
}
