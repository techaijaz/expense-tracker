import InfoCard from './InfoCard';
import Piechart from './Piechart';
import axiosInstance from '@/utils/axiosInstance';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Linechart } from './Linechart';
import { InvoiceTable } from './InvoiceTable';
import { useSelector } from 'react-redux';
import { formatAmount, getCurrencySymbol } from '@/utils/format';

function Dashboard() {
  const { openTransactionPopup } = useOutletContext();
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trend, setTrend] = useState([]);
  const [accountsMode, setAccountsMode] = useState([]);
  const [recent, setRecent] = useState([]);

  const preferences = useSelector(
    (state) => state.auth.user?.user?.preferences,
  );
  const { currency = 'INR', decimalPlaces = 2 } = preferences || {};
  const currencySymbol = getCurrencySymbol(currency);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewRes, categoriesRes, trendRes, distRes, recentRes] =
          await Promise.all([
            axiosInstance.get('/reports/overview'),
            axiosInstance.get('/reports/categories'),
            axiosInstance.get('/reports/trend'),
            axiosInstance.get('/reports/accounts-distribution'),
            axiosInstance.get('/reports/recent'),
          ]);

        setOverview(overviewRes.data.data);

        if (categoriesRes.data.data) {
          const formattedCats = categoriesRes.data.data.map((c) => ({
            name: c.categoryName,
            value: c.totalAmount,
          }));
          setCategories(formattedCats);
        }

        setTrend(trendRes.data.data);

        if (distRes.data.data) {
          const formattedAccts = distRes.data.data.map((a) => ({
            name: a.accountName,
            value: a.balance,
          }));
          setAccountsMode(formattedAccts);
        }

        setRecent(recentRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchDashboardData();
  }, []);

  const totalBalance = overview?.currentMonth?.income
    ? overview.currentMonth.income - overview.currentMonth.expense
    : 0;

  return (
    <div className="max-w-[1400px] mx-auto p-8 space-y-8 w-full">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline text-on-surface tracking-tight">
            aiexpenser
          </h1>
          <p className="text-outline text-sm mt-1">
            Global liquidity overview for the last 30 days.
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-surface-container-high px-4 py-2 rounded-md text-sm font-medium text-outline hover:text-on-surface transition-colors flex items-center">
            <span
              className="material-symbols-outlined text-sm mr-2"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              calendar_today
            </span>
            Sept 1 - Sept 30
          </button>
          <button className="bg-surface-container-high px-3 py-2 rounded-md text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-sm">
              filter_list
            </span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard
          accentColor="tertiary"
          icon="account_balance"
          title="Total Balance"
          amount={formatAmount(totalBalance, currency, decimalPlaces)}
          trendText={
            overview?.comparison?.incomeChange > 0
              ? `+${overview.comparison.incomeChange}% from last month`
              : `${overview?.comparison?.incomeChange || 0}% from last month`
          }
          trendUp={overview?.comparison?.incomeChange >= 0}
        />
        <InfoCard
          accentColor="primary"
          icon="payments"
          title="Monthly Income"
          amount={formatAmount(
            overview?.currentMonth?.income || 0,
            currency,
            decimalPlaces,
          )}
          trendText={
            overview?.comparison?.incomeChange > 0
              ? `${formatAmount((overview?.currentMonth?.income || 0) - (overview?.previousMonth?.income || 0), currency, decimalPlaces)} higher than prev`
              : 'Down from prev month'
          }
          trendUp={overview?.comparison?.incomeChange >= 0}
        />
        <InfoCard
          accentColor="error"
          icon="shopping_cart"
          title="Monthly Expense"
          amount={formatAmount(
            overview?.currentMonth?.expense || 0,
            currency,
            decimalPlaces,
          )}
          trendText={
            overview?.comparison?.expenseChange < 0
              ? `Reduced by ${Math.abs(overview.comparison.expenseChange)}%`
              : `+${overview?.comparison?.expenseChange || 0}% higher`
          }
          trendUp={overview?.comparison?.expenseChange <= 0}
        />
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Linechart data={trend} />
        </div>
        <div className="lg:col-span-1">
          <Piechart
            title="Asset Distribution"
            data={
              accountsMode.length > 0
                ? accountsMode
                : [
                    { name: 'Cash & Savings', value: 842000 },
                    { name: 'Crypto Portfolio', value: 312592 },
                    { name: 'Commodities', value: 130000 },
                  ]
            }
          />
        </div>
      </div>

      <InvoiceTable transactions={recent} />

      {/* Contextual FAB */}
      <button
        onClick={openTransactionPopup}
        className="fixed bottom-10 right-10 w-16 h-16 rounded-full btn-primary-gradient text-on-primary shadow-2xl shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-90 z-50"
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={{ fontVariationSettings: "'wght' 600" }}
        >
          add
        </span>
      </button>
    </div>
  );
}

export default Dashboard;
