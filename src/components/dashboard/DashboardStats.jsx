import React from 'react';

const ICONS = {
  blue: '🏛️',
  green: '💵',
  red: '🛒',
  amber: '💳',
  purple: '📈',
};

const TREND_LABELS = {
  blue:  { up: '↑', down: '↓' },
  green: { up: '↑', down: '↓' },
  red:   { up: '↑', down: '↑' },   // for expense, up is bad
};

const StatCard = ({ title, value, trend, trendValue, color, trendLabel }) => {
  const isUp = trend === 'up';
  // For expenses (red), "up" trend means more spending = bad (down color)
  const changeClass = color === 'red'
    ? (isUp ? 'down' : 'up')
    : (isUp ? 'up' : 'down');

  const arrow = isUp ? '↑' : '↓';

  return (
    <div className={`kpi-card ${color}`}>
      <div className={`kpi-icon ${color}`}>{ICONS[color] || '💰'}</div>
      <div className="kpi-label">{title}</div>
      <div className="kpi-val">{value}</div>
      <div className={`kpi-change ${changeClass}`}>
        {arrow} {trendLabel || `${trendValue}% vs last month`}
      </div>
    </div>
  );
};

export const DashboardStats = ({ stats }) => {
  return (
    <div className="stat-row">
      <StatCard
        title="Total Balance"
        value={stats.totalBalance}
        trend={stats.balanceTrend}
        trendValue={stats.balanceTrendValue}
        trendLabel={`+${stats.balanceTrendValue}% from last month`}
        color="blue"
      />
      <StatCard
        title="Monthly Income"
        value={stats.monthlyIncome}
        trend={stats.incomeTrend}
        trendValue={stats.incomeTrendValue}
        trendLabel={`↑ vs last month`}
        color="green"
      />
      <StatCard
        title="Monthly Expense"
        value={stats.monthlyExpense}
        trend={stats.expenseTrend}
        trendValue={stats.expenseTrendValue}
        trendLabel={`↑ ${stats.expenseTrendValue}% vs last month`}
        color="red"
      />
    </div>
  );
};

export default DashboardStats;
