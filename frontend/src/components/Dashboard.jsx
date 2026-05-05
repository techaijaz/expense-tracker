import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '@/utils/axiosInstance';
import useFormat from '@/hooks/useFormat';

// New Premium Components
import DashboardStats from './dashboard/DashboardStats';
import CashFlowChart from './dashboard/CashFlowChart';
import SpendingDonut from './dashboard/SpendingDonut';
import BudgetOverview from './dashboard/BudgetOverview';
import UpcomingPayments from './dashboard/UpcomingPayments';
import RecentTransactionsMini from './dashboard/RecentTransactionsMini';

import { toast } from 'sonner';

function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [refetchTick, setRefetchTick] = useState(0);

  const { formatAmount } = useFormat();
  const { user } = useSelector((state) => state.auth);
  const { dateRange } = useSelector((state) => state.dashboard);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await axiosInstance.post('/user/resend-verification', {
        email: user.email,
      });
      if (response.data.success) {
        toast.success('Verification email resent! Please check your inbox.');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to resend verification.',
      );
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const handler = () => setRefetchTick((t) => t + 1);
    window.addEventListener('refetch-system-metrics', handler);
    return () => window.removeEventListener('refetch-system-metrics', handler);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const params = {};
        if (dateRange.from && dateRange.to) {
          params.startDate = dateRange.from;
          params.endDate = dateRange.to;
        }

        const [overviewRes, categoriesRes, trendRes, recentRes, upcomingRes, budgetsRes] =
          await Promise.all([
            axiosInstance.get('/reports/overview', { params }),
            axiosInstance.get('/reports/categories', { params }),
            axiosInstance.get('/reports/trend', {
              params: {
                ...params,
                groupBy: 'month',
                period: params.startDate ? undefined : 'last6months',
              },
            }),
            axiosInstance.get('/reports/recent'),
            axiosInstance.get('/reports/upcoming'),
            axiosInstance.get('/budget/performance'),
          ]);

        setOverview(overviewRes.data.data);
        setCategories(categoriesRes.data.data || []);
        setTrend(trendRes.data.data || []);
        setRecent(recentRes.data.data || []);
        setUpcoming(upcomingRes.data.data || []);
        setBudgets(budgetsRes.data.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchDashboardData();
  }, [dateRange, refetchTick]);

  const statsData = {
    totalBalance: formatAmount(overview?.totalBalance || 0),
    balanceTrend:
      (overview?.comparison?.incomeChange || 0) >= 0 ? 'up' : 'down',
    balanceTrendValue: Math.abs(overview?.comparison?.incomeChange || 0),

    monthlyIncome: formatAmount(overview?.currentMonth?.income || 0),
    incomeTrend: (overview?.comparison?.incomeChange || 0) >= 0 ? 'up' : 'down',
    incomeTrendValue: Math.abs(overview?.comparison?.incomeChange || 0),

    monthlyExpense: formatAmount(overview?.currentMonth?.expense || 0),
    expenseTrend:
      (overview?.comparison?.expenseChange || 0) <= 0 ? 'down' : 'up',
    expenseTrendValue: Math.abs(overview?.comparison?.expenseChange || 0),
  };

  const donutData = categories.map((c) => ({
    name: c.categoryName,
    value: c.totalAmount || 0,
  }));
  const totalSpending = categories.reduce(
    (acc, curr) => acc + (curr.totalAmount || 0),
    0,
  );

  const cashFlowData = trend.map((t) => ({
    month: t.month,
    income: t.income,
    expense: t.expense,
  }));

  const displayBudgets = budgets.map((b) => ({
    categoryName: b.category?.name || 'Unknown',
    totalAmount: b.spentAmount,
    limit: b.budgetAmount,
  }));


  return (
    <div className="page-body">
      {!user?.isVerified && (
        <div className="mb-6 p-4 bg-amber-bg border border-amber-border rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber">
              warning
            </span>
            <div>
              <p className="text-sm font-semibold text-text">
                Verify your email address
              </p>
              <p className="text-xs text-text2">
                Please verify your email to ensure full account security and
                access to all features.
              </p>
            </div>
          </div>
          <button
            onClick={handleResend}
            disabled={resending}
            className="px-4 py-2 bg-amber text-bg font-bold rounded-lg text-xs hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}
      {/* Row 1: Key Stats */}
      <DashboardStats stats={statsData} />

      {/* Row 2: Cash Flow + Spending Donut */}
      <div className="grid-3">
        <CashFlowChart data={cashFlowData} />
        <SpendingDonut data={donutData} total={totalSpending} />
      </div>

      {/* Row 3: Recent Txns | Budget Overview | Upcoming Payments */}
      <div
        className="flex flex-wrap gap-4"
        style={{ marginBottom: 24 }}
      >
        <div style={{ flex: '1 1 300px' }}>
          <RecentTransactionsMini
            transactions={recent}
            onViewAll={() => navigate('/transactions')}
          />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <BudgetOverview budgets={displayBudgets} />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <UpcomingPayments payments={upcoming} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
