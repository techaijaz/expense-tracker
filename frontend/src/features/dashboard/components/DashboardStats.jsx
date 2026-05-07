import React from 'react';
import PremiumKpiCard from '@/components/ui/PremiumKpiCard';
import { Wallet, Landmark, Receipt } from 'lucide-react';

export const DashboardStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <PremiumKpiCard
        title="Total Balance"
        value={stats.totalBalance}
        trend={{
          value: `${stats.balanceTrendValue}%`,
          direction: stats.balanceTrend === 'up' ? 'up' : 'down',
          label: 'from last month'
        }}
        icon={Wallet}
        color="blue"
      />
      <PremiumKpiCard
        title="Monthly Income"
        value={stats.monthlyIncome}
        trend={{
          value: '↑',
          direction: stats.incomeTrend === 'up' ? 'up' : 'down',
          label: 'vs last month'
        }}
        icon={Landmark}
        color="green"
      />
      <PremiumKpiCard
        title="Monthly Expense"
        value={stats.monthlyExpense}
        trend={{
          value: `${stats.expenseTrendValue}%`,
          direction: stats.expenseTrend === 'up' ? 'down' : 'up', // For expenses, "up" trend is "down" (bad)
          label: 'vs last month'
        }}
        icon={Receipt}
        color="red"
      />
    </div>
  );
};

export default DashboardStats;

