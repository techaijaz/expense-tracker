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

  const { formatAmount } = useFormat();
  const { user } = useSelector((state) => state.auth);
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
    const fetchDashboardData = async () => {
      try {
        const [overviewRes, categoriesRes, trendRes, recentRes, upcomingRes] =
          await Promise.all([
            axiosInstance.get('/reports/overview'),
            axiosInstance.get('/reports/categories'),
            axiosInstance.get(
              '/reports/trend?period=last6months&groupBy=month',
            ),
            axiosInstance.get('/reports/recent'),
            axiosInstance.get('/reports/upcoming'),
          ]);

        setOverview(overviewRes.data.data);
        setCategories(categoriesRes.data.data || []);
        setTrend(trendRes.data.data || []);
        setRecent(recentRes.data.data || []);
        setUpcoming(upcomingRes.data.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchDashboardData();
  }, []);

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

  const mockBudgets = categories.slice(0, 5).map((c) => ({
    categoryName: c.categoryName,
    totalAmount: c.totalAmount,
    limit: c.totalAmount * 1.2,
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
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}
      >
        <RecentTransactionsMini
          transactions={recent}
          onViewAll={() => navigate('/transactions')}
        />
        <BudgetOverview budgets={mockBudgets} />
        <UpcomingPayments payments={upcoming} />
      </div>
    </div>
  );
}

export default Dashboard;
