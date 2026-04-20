import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Gem,
  Landmark,
  CreditCard,
  User2,
  PieChart as PieChartIcon,
  MoreVertical,
  History,
  Info,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  Building2,
  Briefcase,
  Handshake,
  Users,
  Box,
  LockKeyhole,
  Bike,
  Coins,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import useFormat from '@/hooks/useFormat';
import AddAssetPopup from './AddAssetPopup';
import AddAccounts from './AddAccounts';
import { DeleteConfirmModal } from './SharedComponents';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Trash2, Edit2, AlertCircle } from 'lucide-react';

const NetWorth = () => {
  const { formatAmount, formatDate } = useFormat();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Investments');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [timeRange, setTimeRange] = useState('12M');
  const [data, setData] = useState({
    overview: null,
    history: [],
    assets: [],
    accounts: [],
  });
  const [accountToEdit, setAccountToEdit] = useState(null);
  const navigate = useNavigate();

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'asset' or 'account'
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nwRes, historyRes, assetsRes, accountsRes] = await Promise.all([
        api.get('/net-worth'),
        api.get('/net-worth/history'),
        api.get('/assets'),
        api.get('/account'),
      ]);

      const finalOverview = nwRes.data || nwRes;
      const finalHistory = Array.isArray(historyRes.data)
        ? historyRes.data
        : Array.isArray(historyRes)
          ? historyRes
          : [];
      const finalAssets = Array.isArray(assetsRes.data)
        ? assetsRes.data
        : Array.isArray(assetsRes)
          ? assetsRes
          : [];
      const finalAccounts = Array.isArray(accountsRes.data)
        ? accountsRes.data
        : Array.isArray(accountsRes)
          ? accountsRes
          : [];

      setData({
        overview:
          finalOverview &&
          typeof finalOverview === 'object' &&
          !Array.isArray(finalOverview)
            ? finalOverview
            : null,
        history: finalHistory,
        assets: finalAssets,
        accounts: finalAccounts,
      });
    } catch (error) {
      console.error('Error fetching net worth data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getLaRatio = () => {
    if (!data.overview || !data.overview.totalAssets) return '0.00';
    return (data.overview.totalLiabilities / data.overview.totalAssets).toFixed(
      2,
    );
  };

  const getArchitectAdvice = () => {
    if (!data.overview) return null;
    const { totalAssets, totalLiabilities, breakdown } = data.overview;
    const ratio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;

    if (totalAssets === 0) {
      return {
        title: 'Architecture Uninitialized',
        message:
          'No assets detected in your portfolio. Begin by adding your physical holdings or linking investment accounts.',
        color: 'text-text3',
        iconColor: 'from-bg3 to-bg4',
        status: 'PENDING',
      };
    }

    if (breakdown?.creditCardDebt > 0) {
      return {
        title: 'Credit Drain Alert',
        message:
          'High-interest Credit Card debt detected. We recommend prioritizing its liquidation immediately to preserve your credit score and cash flow.',
        color: 'text-red',
        iconColor: 'from-red/60 to-red',
        status: 'CRITICAL',
      };
    }

    if (ratio > 0.3) {
      return {
        title: 'High Leverage Warning',
        message: `Your liability ratio of ${ratio.toFixed(2)}x is above the recommended threshold. Focus on consolidating debt to improve your financial stability.`,
        color: 'text-amber',
        iconColor: 'from-amber/60 to-amber',
        status: 'WARNING',
      };
    }

    if (ratio === 0) {
      return {
        title: 'Financial Fortress',
        message:
          'Your financial architecture is exceptionally stable with zero debt. Consider diversifying your liquid capital into high-growth investment vehicles.',
        color: 'text-accent',
        iconColor: 'from-accent/60 to-accent',
        status: 'EXCELLENT',
      };
    }

    return {
      title: 'Solid Foundation',
      message: `Your liability ratio of ${ratio.toFixed(2)}x is well within healthy limits. Maintain your current trajectory and focus on scaling your physical asset vault.`,
      color: 'text-green',
      iconColor: 'from-green/60 to-green',
      status: 'HEALTHY',
    };
  };

  const { overview, history, assets, accounts } = data;
  const laRatio = getLaRatio();
  const advice = getArchitectAdvice();

  const initiateDelete = (item, type) => {
    setItemToDelete(item);
    setDeleteType(type);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteBusy(true);
    try {
      const endpoint =
        deleteType === 'asset'
          ? `/assets/${itemToDelete._id}`
          : `/account/${itemToDelete._id}`;
      const res = await api.delete(endpoint);
      if (res.success) {
        toast.success(
          `${deleteType === 'asset' ? 'Asset' : 'Account'} removed successfully`,
        );
        fetchData();
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      toast.error(`Failed to remove ${deleteType}`);
    } finally {
      setDeleteBusy(false);
    }
  };

  // Filtered History for Chart
  const filteredHistory = React.useMemo(() => {
    if (!history || history.length === 0) return [];
    if (timeRange === 'ALL') return history;
    // Show only last 12 entries for 12M
    return history.slice(-12);
  }, [history, timeRange]);

  // Merge Assets and Investment Accounts
  const investmentItems = React.useMemo(() => {
    return (accounts || [])
      .filter((acc) => acc.type === 'INVESTMENT')
      .map((acc) => ({
        _id: acc._id,
        name: acc.name,
        type: acc.type, // Preserving original 'INVESTMENT' type
        currentValue: acc.balance,
        description: acc.accountNumber
          ? `•••• ${acc.accountNumber.slice(-4)}`
          : 'Investment Account',
        accountNumber: acc.accountNumber, // Preserving full account number for Edit
        initialValue: acc.balance, // Default for accounts
        acquiredAt: acc.createdAt,
        isAsset: false,
      }));
  }, [accounts]);

  const physicalItems = React.useMemo(() => {
    return (assets || []).map((a) => ({
      ...a,
      isAsset: true,
    }));
  }, [assets]);

  // Physical Valuation Logic for KPI
  const physicalAssetsTotal = physicalItems.reduce(
    (sum, asset) => sum + (asset.currentValue || 0),
    0,
  );
  const investmentAssetsTotal = investmentItems.reduce(
    (sum, item) => sum + (item.currentValue || 0),
    0,
  );

  // Latest 2 Physical Assets for Recent section
  const latestPhysicalValuations = React.useMemo(() => {
    return [...physicalItems]
      .sort((a, b) => new Date(b.acquiredAt) - new Date(a.acquiredAt))
      .slice(0, 2);
  }, [physicalItems]);

  const dummyValuations = [
    {
      _id: 'dummy-1',
      name: 'Gold (24K)',
      description: 'Bullion & Jewelry',
      currentValue: 120000,
      initialValue: 107000,
      type: 'GOLD',
      isDummy: true,
    },
    {
      _id: 'dummy-2',
      name: 'Royal Enfield',
      description: 'Classic 350 - Chrome',
      currentValue: 210000,
      acquiredAt: '2023-01-01',
      type: 'VEHICLE',
      isDummy: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="loader-mini w-10 h-10 border-4"></div>
        <p className="text-text2 font-medium">
          Calculating your financial architecture...
        </p>
      </div>
    );
  }

  if (!data.overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-red text-4xl mb-2">⚠️</div>
        <p className="text-text font-bold">Failed to load net worth data</p>
        <button className="btn-outline px-6" onClick={fetchData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page-body max-w-[1400px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 overflow-hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-text">
              Net Worth
            </h1>
            <span className="bg-accent-glow text-accent text-[10px] font-bold px-2.5 py-1 rounded-md border border-accent/20 uppercase tracking-widest hidden sm:inline-block">
              Premium Architecture
            </span>
          </div>
          <p className="text-text2 text-sm max-w-lg leading-relaxed">
            Comprehensive tracking of your global financial standing across
            physical assets and liabilities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            className="btn-outline h-[42px] px-5 gap-2.5 active:scale-95 transition-transform"
            onClick={() => fetchData()}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Sync Portfolio</span>
          </button>
          <button
            className="btn-primary-gradient h-[42px] px-6 rounded-xl flex items-center justify-center gap-2.5 text-white font-bold text-sm shadow-lg shadow-accent/20 active:scale-95 transition-transform"
            onClick={() => setShowAddPopup(true)}
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            Add New Asset
          </button>
        </div>
      </div>

      {/* Main KPI & Chart Grid */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12 items-stretch min-h-[420px]">
        {/* Left: Summary Cards */}
        <div className="w-full lg:w-[350px] flex flex-col shrink-0">
          <div className="account-card flex-1 relative overflow-hidden flex flex-col justify-between shadow-sm">
            <div className="space-y-10 relative z-10">
              <div className="group">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-text3 uppercase tracking-[0.2em]">
                    Total Assets
                  </div>
                  <span className="acc-type-badge bank">
                    <Landmark size={12} className="mr-1" />
                    Portfolio
                  </span>
                </div>
                <div className="text-4xl font-bold font-mono text-accent tracking-tighter">
                  {formatAmount(overview.totalAssets, null, 0)}
                </div>
              </div>

              <div className="group">
                <div className="text-[11px] font-bold text-text3 uppercase tracking-[0.2em] mb-3">
                  Total Liabilities
                </div>
                <div className="text-2xl font-bold font-mono text-text2/60 tracking-tight">
                  {formatAmount(overview.totalLiabilities, null, 0)}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border/50 relative z-10 mt-8">
              <div className="text-[11px] font-bold text-accent uppercase tracking-[0.2em] mb-3">
                Net Worth Valuation
              </div>
              <div
                className={`text-5xl font-extrabold font-mono tracking-tighter ${overview.netWorth >= 0 ? 'text-green' : 'text-red'}`}
              >
                {formatAmount(overview.netWorth, null, 0)}
              </div>
            </div>

            {/* Visual background element - Explicitly low opacity */}
            <div
              className="absolute -right-8 -bottom-8 text-text pointer-events-none"
              style={{ opacity: 0.03 }}
            >
              <Landmark size={240} strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* Right: Trajectory Chart */}
        <div className="flex-1 min-w-0">
          <div className="account-card h-full flex flex-col relative overflow-hidden shadow-sm !p-8">
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-text">
                  Net Worth Trajectory
                </h3>
                <p className="text-[10px] text-text3 uppercase mt-1.5 font-bold tracking-[0.15em]">
                  Historical Growth Arc
                </p>
              </div>

              <div className="flex h-[32px] min-w-[190px] rounded-xl border border-white/10 bg-[#141928] overflow-hidden">
                {[
                  { id: '12M', label: '12 MONTHS' },
                  { id: 'ALL', label: 'ALL TIME' },
                ].map((range) => (
                  <div
                    key={range.id}
                    onClick={() => setTimeRange(range.id)}
                    className={`flex-1 flex items-center justify-center px-4 text-[9px] font-extrabold cursor-pointer transition-all border-r border-white/5 last:border-r-0 ${
                      timeRange === range.id
                        ? 'bg-[#5B8DEF] text-white'
                        : 'text-[#8892B0] hover:bg-white/[0.05]'
                    }`}
                  >
                    {range.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full min-h-[250px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorNW" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--accent)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--accent)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text3)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    tickFormatter={(val) =>
                      new Date(val).toLocaleDateString('en-IN', {
                        month: 'short',
                      })
                    }
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: 'var(--text3)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    tickFormatter={(val) => (val / 100000).toFixed(0) + 'L'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg3)',
                      border: '1px solid var(--border3)',
                      borderRadius: '16px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                      padding: '12px',
                    }}
                    itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                    labelStyle={{
                      color: 'var(--text3)',
                      marginBottom: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                    formatter={(val) => [
                      formatAmount(val, null, 0),
                      'Market Valuation',
                    ]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="var(--accent)"
                    strokeWidth={4}
                    dot={{
                      fill: 'var(--accent)',
                      strokeWidth: 2,
                      r: 4,
                      stroke: 'var(--bg2)',
                    }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--accent)' }}
                    fillOpacity={1}
                    fill="url(#colorNW)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 flex items-center justify-between relative z-10">
              <div className="text-[10px] text-text3 font-bold uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                Live Net Worth Calculation
              </div>
              <div className="flex items-center gap-1.5 text-green bg-green-bg px-4 py-2 rounded-xl border border-green-border">
                <TrendingUp size={14} className="stroke-[3px]" />
                <span className="text-[11px] font-extrabold">
                  +59.3% SYNCED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liabilities Section - Moved to 2nd row */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-bg flex items-center justify-center text-red">
              <Landmark size={18} />
            </div>
            <h3 className="text-xl font-bold text-text">
              Outstanding Liabilities
            </h3>
          </div>
          <div className="text-[11px] font-bold text-text3 uppercase tracking-widest">
            Total Liability Pool:{' '}
            <span className="text-text font-bold ml-2 font-mono">
              {formatAmount(overview.totalLiabilities, null, 0)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'FORMAL LOANS',
              val: overview.breakdown?.formalLoans,
              icon: Landmark,
              color: 'red',
              sub: 'Auto-syncing from HDFC Bank',
              badge: 'HIGH PRIORITY',
            },
            {
              label: 'CREDIT CARDS',
              val: overview.breakdown?.creditCardDebt,
              icon: CreditCard,
              color: 'accent',
              sub: `Due in ${Math.floor(Math.random() * 20) + 1} days`,
              badge: 'ACTIVE',
            },
            {
              label: 'PERSONAL DEBT',
              val: overview.breakdown?.informalDebt,
              icon: Handshake,
              color: 'purple',
              sub: 'Private Arrangement',
              badge: 'PRIVATE',
            },
          ].map((item, i) => (
            <div key={i} className="account-card group shadow-sm">
              <div className="flex justify-between items-start mb-6 transition-transform group-hover:-translate-y-1 duration-300">
                <div
                  className={`w-10 h-10 rounded-xl bg-${item.color}-bg flex items-center justify-center text-${item.color}`}
                >
                  <item.icon size={20} />
                </div>
                <span
                  className={`acc-type-badge ${item.color === 'accent' ? 'bank' : item.color === 'red' ? 'credit' : 'investment'}`}
                >
                  {item.badge}
                </span>
              </div>

              <div className="text-[10px] font-black text-text3 uppercase tracking-[0.2em] mb-3">
                {item.label}
              </div>

              <div className="text-3xl font-bold font-mono text-text tracking-tighter mb-6">
                {formatAmount(item.val, null, 0)}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-text3 italic opacity-60 pt-4 border-t border-border/30">
                <div className={`w-1 h-1 rounded-full bg-${item.color}`}></div>
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Portfolio Section - Moved to 3rd row */}
      <div className="mb-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Gem size={18} />
            </div>
            <h3 className="text-xl font-bold text-text">Asset Portfolio</h3>
          </div>

          <div className="flex h-[32px] min-w-[300px] rounded-xl border border-white/10 bg-[#141928] overflow-hidden self-start sm:self-auto">
            {[
              { id: 'Investments', label: 'INVESTMENTS' },
              { id: 'Physical Assets', label: 'PHYSICAL ASSETS' },
            ].map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-6 text-[9px] font-extrabold cursor-pointer transition-all border-r border-white/5 last:border-r-0 ${
                  activeTab === tab.id
                    ? 'bg-[#5B8DEF] text-white'
                    : 'text-[#8892B0] hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg2/10 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_4px_24px_-4px_rgba(0,0,0,0.3)] rounded-[28px] p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'Investments' ? (
              <>
                {investmentItems.map((item) => {
                  let Icon = LockKeyhole;
                  if (item.type === 'INVESTMENT') Icon = Box;

                  return (
                    <div
                      key={item._id}
                      className="account-card group !p-6 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all duration-500"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-xl bg-bg3 flex items-center justify-center text-accent/80 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                          <Icon size={22} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text3 hover:bg-bg3 transition-all">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-[#1a1f2e] border-white/5 shadow-2xl"
                          >
                            <DropdownMenuItem
                              onClick={() => setAccountToEdit(item)}
                              className="gap-2 cursor-pointer text-text2 focus:text-white focus:bg-white/5 px-3 py-2.5"
                            >
                              <Edit2 size={14} className="text-accent" />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                Edit Account
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => initiateDelete(item, 'account')}
                              className="gap-2 cursor-pointer text-red focus:text-red focus:bg-red/5 px-3 py-2.5"
                            >
                              <Trash2 size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                Delete Account
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-1 mb-8">
                        <div className="text-lg font-bold text-text group-hover:text-accent transition-colors truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-bold text-text3/60 uppercase tracking-wider truncate">
                          Investment Account
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="text-[10px] font-black text-text3 uppercase tracking-[0.2em] mb-2 opacity-50">
                          Current Value
                        </div>
                        <div className="text-3xl font-extrabold font-mono text-text tracking-tighter">
                          {formatAmount(item.currentValue, null, 0)}
                        </div>
                      </div>

                      <div className="pt-5 border-t border-border/30 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] font-black text-text3 uppercase tracking-widest opacity-40">
                            Initial
                          </div>
                          <div className="text-[11px] font-bold text-text2 font-mono">
                            {formatAmount(item.initialValue, null, 0)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className="text-[9px] font-black text-text3 uppercase tracking-widest opacity-40">
                            Date
                          </div>
                          <div className="text-[10px] font-bold text-text3">
                            {new Date(item.acquiredAt).toLocaleDateString(
                              'en-IN',
                              { month: 'short', year: 'numeric' },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {physicalItems.map((asset) => (
                  <div
                    key={asset._id}
                    className="account-card group !p-6 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-xl hover:shadow-accent/5 transition-all duration-500"
                    onClick={() => setAssetToEdit(asset)}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 rounded-xl bg-bg3 flex items-center justify-center text-amber/80 group-hover:bg-amber/10 group-hover:text-amber transition-colors">
                        {asset.type === 'REAL_ESTATE' ? (
                          <Building2 size={22} />
                        ) : asset.type === 'VEHICLE' ? (
                          <Bike size={22} />
                        ) : asset.type === 'GOLD' ? (
                          <Sparkles size={22} />
                        ) : asset.type === 'SILVER' ? (
                          <Coins size={22} />
                        ) : (
                          <Gem size={22} />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text3 hover:bg-bg3 transition-all">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-[#1a1f2e] border-white/5 shadow-2xl"
                        >
                          <DropdownMenuItem
                            onClick={() => setAssetToEdit(asset)}
                            className="gap-2 cursor-pointer text-text2 focus:text-white focus:bg-white/5 px-3 py-2.5"
                          >
                            <Edit2 size={14} className="text-amber" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Edit Valuation
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => initiateDelete(asset, 'asset')}
                            className="gap-2 cursor-pointer text-red focus:text-red focus:bg-red/5 px-3 py-2.5"
                          >
                            <Trash2 size={14} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Delete Asset
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-1 mb-8">
                      <div className="text-lg font-bold text-text group-hover:text-amber transition-colors truncate">
                        {asset.name}
                      </div>
                      <div className="text-[11px] font-bold text-text3/60 uppercase tracking-wider truncate">
                        {asset.description || 'Verified Physical Asset'}
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="text-[10px] font-black text-text3 uppercase tracking-[0.2em] mb-2 opacity-50">
                        Current Value
                      </div>
                      <div className="text-3xl font-extrabold font-mono text-text tracking-tighter">
                        {formatAmount(asset.currentValue, null, 0)}
                      </div>
                    </div>

                    <div className="pt-5 border-t border-border/30 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="text-[9px] font-black text-text3 uppercase tracking-widest opacity-40">
                          Initial
                        </div>
                        <div className="text-[11px] font-bold text-text2 font-mono">
                          {formatAmount(
                            asset.initialValue || asset.currentValue,
                            null,
                            0,
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <div className="text-[9px] font-black text-text3 uppercase tracking-widest opacity-40">
                          Date
                        </div>
                        <div className="text-[10px] font-bold text-text3">
                          {formatDate(asset.acquiredAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {((activeTab === 'Investments' && investmentItems.length === 0) ||
              (activeTab === 'Physical Assets' &&
                physicalItems.length === 0)) && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-text3/40">
                <div className="w-20 h-20 rounded-full bg-bg3/50 flex items-center justify-center mb-6 border border-border/20">
                  <Box size={40} strokeWidth={1.5} className="opacity-20" />
                </div>
                <h4 className="text-lg font-bold text-text2 mb-1">
                  Portfolio Archive Empty
                </h4>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                  No holdings detected in this category
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Physical Valuations Section - Borderless Design with Dummy State */}
      <div className="mb-14">
        <div className="text-[11px] font-bold text-text3 uppercase tracking-[0.2em] mb-7 px-1">
          Recent Physical Valuations
        </div>

        {physicalItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(latestPhysicalValuations.length > 0
              ? latestPhysicalValuations
              : dummyValuations
            ).map((asset, idx) => {
              const growth =
                asset.initialValue > 0
                  ? (
                      ((asset.currentValue - asset.initialValue) /
                        asset.initialValue) *
                      100
                    ).toFixed(0)
                  : 0;

              let Icon = Gem;
              let iconColor = 'text-amber';

              if (asset.type === 'VEHICLE') Icon = Bike;
              else if (asset.type === 'REAL_ESTATE') Icon = Building2;

              return (
                <div
                  key={asset._id}
                  className={`account-card group relative !p-6 flex items-center justify-between overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-accent/5 cursor-pointer !border-none ${asset.isDummy ? 'opacity-40 grayscale-[0.5]' : ''}`}
                  onClick={() =>
                    !asset.isDummy
                      ? setAssetToEdit(asset)
                      : setShowAddPopup(true)
                  }
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-bg3 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-base font-bold text-text mb-0.5 group-hover:text-accent transition-colors">
                          {asset.name}
                        </div>
                        {asset.isDummy && (
                          <span className="text-[8px] bg-bg4 text-text3 px-1.5 py-0.5 rounded font-black tracking-tighter">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text3 font-bold uppercase tracking-[0.15em] opacity-60">
                        {asset.description ||
                          (asset.type === 'GOLD'
                            ? 'Bullion & Jewelry'
                            : 'Physical Holding')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right relative z-10">
                    <div className="text-2xl font-bold font-mono text-text tracking-tighter mb-1">
                      {formatAmount(asset.currentValue, null, 0)}
                    </div>
                    <div
                      className={`text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'text-accent' : 'text-text3/60'}`}
                    >
                      {asset.isDummy && idx === 1
                        ? 'PURCHASED 2023'
                        : idx === 0 || !asset.acquiredAt
                          ? `${growth >= 0 ? '+' : ''}${growth}% Since Purchase`
                          : `Purchased ${new Date(asset.acquiredAt).getFullYear()}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="col-span-full py-24 flex flex-col items-center justify-center bg-bg2/20 rounded-[32px] border border-white/5 transition-all cursor-pointer group hover:bg-bg2/40"
            onClick={() => setShowAddPopup(true)}
          >
            <div className="w-24 h-24 rounded-full bg-bg3/50 flex items-center justify-center mb-6 text-text3/40 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <ShieldCheck size={48} strokeWidth={1} />
            </div>
            <h4 className="text-xl font-bold text-text mb-2">
              Physical Vault Uninitialized
            </h4>
            <p className="text-[10px] font-black text-text3 uppercase tracking-[0.2em] mb-8">
              No physical holdings detected in your architecture
            </p>
            <button className="btn-outline px-8 h-[42px] rounded-xl border-accent/20 text-accent hover:bg-accent/10">
              Initialize Vault
            </button>
          </div>
        )}
      </div>

      {/* Architect's Advice Banner - Harmonized Colors */}
      <div className="bg-bg2/80 border border-white/5 rounded-[32px] p-6 mb-12 relative overflow-hidden group shadow-2xl backdrop-blur-md">
        {/* Subtle background glow */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-accent/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative">
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${advice?.iconColor || 'from-accent/60 to-accent'} flex items-center justify-center shadow-xl shadow-accent/20 group-hover:rotate-12 transition-transform duration-500`}
            >
              <Sparkles className="text-white w-8 h-8" />
            </div>
            {/* Pulsing notification dot */}
            {(advice?.status === 'CRITICAL' ||
              advice?.status === 'WARNING') && (
              <div
                className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 ${advice.status === 'CRITICAL' ? 'bg-red' : 'bg-amber'} rounded-full border-[3px] border-bg2 animate-pulse`}
              ></div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-text mb-2 tracking-tight">
              {advice?.title || "Architect's Advice"}
            </h3>
            <p className="text-sm text-text2 leading-relaxed font-medium max-w-3xl">
              {advice?.message ||
                `Your liability-to-asset ratio is currently ${laRatio}x. We recommend regular portfolio reviews.`}
            </p>
          </div>

          <button
            onClick={() => navigate('/analysis')}
            className="h-[48px] px-8 rounded-full bg-bg3 border border-border2 hover:border-accent/40 font-bold text-[11px] uppercase tracking-widest transition-all hover:bg-bg4 active:scale-95 text-text flex items-center gap-3"
          >
            Detailed Analysis
          </button>
        </div>
      </div>

      <AddAssetPopup
        isOpen={showAddPopup || !!assetToEdit}
        onClose={() => {
          setShowAddPopup(false);
          setAssetToEdit(null);
        }}
        onSuccess={fetchData}
        assetToEdit={assetToEdit}
      />

      {accountToEdit && (
        <AddAccounts
          editAccount={accountToEdit}
          onEditClose={() => {
            setAccountToEdit(null);
            fetchData();
          }}
          onSaved={() => {
            setAccountToEdit(null);
            fetchData();
          }}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteConfirmModal
          title={`Remove ${deleteType === 'asset' ? 'Physical Asset' : 'Investment Account'}`}
          description={
            deleteType === 'asset'
              ? `Are you sure you want to remove "${itemToDelete?.name}" from your vault? This cannot be undone.`
              : `Are you sure you want to delete "${itemToDelete?.name}"? You will lose this account's current balance in your net worth portfolio.`
          }
          onConfirm={confirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          busy={deleteBusy}
        />
      )}
    </div>
  );
};

export default NetWorth;
