import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  ShieldCheck,
  Target,
  TrendingUp,
  TrendingDown,
  Info,
  Activity,
  Zap,
  Wallet,
  BarChart3,
  ArrowRight,
  PieChart as PieChartIcon,
  Gem,
  Landmark,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '@/utils/httpMethods';
import { toast } from 'sonner';

// AI Typewriter Hook
const useTypewriter = (text, speed = 30, delay = 0) => {
  const [displayedText, setDisplayedText] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setComplete(false);

    const timeout = setTimeout(() => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
        if (i >= text.length) {
          clearInterval(timer);
          setComplete(true);
        }
      }, speed);
      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { text: displayedText, complete };
};

const FinancialAnalysis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    history: [],
  });
  const [logs, setLogs] = useState([]);
  const bootProgress = 0; // Placeholder

  // Typewriter instances for specific content (MOVED ABOVE CONDITIONAL RETURNS)
  const stabilityAdvice = useTypewriter(
    data.overview
      ? data.overview.netWorth / (data.overview.totalLiabilities || 1) > 5
        ? 'Your architectural foundation is exceptional. Zero structural vulnerabilities detected.'
        : 'Balanced architecture. Maintain trajectory and monitor debt-to-equity ratio.'
      : 'Initializing neural insights...',
    30,
    800,
  );

  const marketInsight = useTypewriter(
    'Based on current acquisition velocity and zero-liability status, your net worth structure is poised for high-magnitude expansion.',
    25,
    1500,
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nwRes, historyRes] = await Promise.all([
        api.get('/net-worth'),
        api.get('/net-worth/history'),
      ]);

      setData({
        overview: nwRes.data || nwRes,
        history: Array.isArray(historyRes.data) ? historyRes.data : historyRes,
      });
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      toast.error('Failed to load analysis engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // AI Log Simulation
    const systemMessages = [
      'Initializing Neural Architecture...',
      'Syncing with Global Market APIs...',
      'Scanning Asset Vaults...',
      'Analyzing Debt-to-Equity structures...',
      'Optimizing Growth Trajectories...',
      'Architect AI Online.',
    ];

    systemMessages.forEach((msg, i) => {
      setTimeout(() => {
        setLogs((prev) => [
          ...prev.slice(-3),
          { id: i, msg, time: new Date().toLocaleTimeString() },
        ]);
      }, i * 800);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#06080F] gap-8 relative overflow-hidden">
        {/* Boot Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(91, 141, 239, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(91, 141, 239, 0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        ></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 animate-pulse">
            <Activity className="w-12 h-12 text-accent" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase mb-1">
            Architect AI
          </h2>
          <p className="text-accent text-[10px] font-black uppercase tracking-widest mb-8">
            Booting Neural Engine
          </p>

          <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-4">
            <div className="h-full bg-accent animate-boot-progress"></div>
          </div>

          <div className="space-y-2 text-center h-20">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="text-[10px] font-mono text-text3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <span className="text-accent">[{log.time}]</span>
                <span className="uppercase tracking-widest">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { overview, history } = data;
  if (!overview) return null;

  const {
    liquidAssets,
    investments,
    physicalAssets,
    totalAssets,
    totalLiabilities,
    breakdown,
  } = overview;

  // 1. Calculate Health Score (0-100)
  const calculateHealthScore = () => {
    let score = 70; // Base score
    const ratio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
    if (ratio === 0) score += 20;
    else if (ratio < 0.1) score += 10;
    else if (ratio > 0.4) score -= 30;
    else if (ratio > 0.2) score -= 10;
    if (breakdown?.creditCardDebt > 0) score -= 15;
    const liquidityRatio = totalAssets > 0 ? liquidAssets / totalAssets : 0;
    if (liquidityRatio > 0.1) score += 10;
    return Math.min(100, Math.max(0, score));
  };

  const healthScore = calculateHealthScore();
  const laRatio =
    totalAssets > 0 ? (totalLiabilities / totalAssets).toFixed(2) : '0.00';

  const allocationData = [
    { name: 'Liquid', value: liquidAssets, color: '#00C2FF' },
    { name: 'Investments', value: investments, color: '#5B8DEF' },
    { name: 'Physical', value: physicalAssets, color: '#FCD34D' },
  ].filter((d) => d.value > 0);

  const getGrowthPrediction = () => {
    if (!history || history.length < 3) return totalAssets * 1.02;
    const currentHist = history[history.length - 1].netWorth;
    const prevHist = history[history.length - 3].netWorth;
    const avgMonthlyGrowth = (currentHist - prevHist) / 2;
    return currentHist + avgMonthlyGrowth * 6;
  };

  const forecastedNW = getGrowthPrediction();
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="page-body max-w-[1400px] mx-auto min-h-screen pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* AI Background Grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
        }}
      ></div>

      {/* Styles for Animations */}
      <style>{`
        @keyframes boot-progress {
          0% { width: 0% }
          100% { width: 100% }
        }
        .animate-boot-progress {
          animation: boot-progress 4.5s linear forwards;
        }
        @keyframes scan {
          0% { top: -100% }
          100% { top: 200% }
        }
        .scan-line {
          height: 50%;
          width: 100%;
          background: linear-gradient(to bottom, transparent, rgba(91, 141, 239, 0.05), transparent);
          position: absolute;
          left: 0;
          animation: scan 4s linear infinite;
          pointer-events: none;
        }
        @keyframes neural-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        .neural-pulse-glow {
          animation: neural-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/net-worth')}
            className="w-12 h-12 rounded-2xl bg-bg2 border border-white/5 flex items-center justify-center text-text3 hover:text-white hover:border-white/20 transition-all active:scale-90"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-2">
              <Activity size={14} />
              AI Architect Engine
            </div>
            <h1 className="text-4xl font-extrabold text-text tracking-tight">
              Financial Analysis
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="btn-outline h-[42px] px-5 gap-2.5 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh Logic</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Row 1: Health Score (4) & Key Metrics (8) */}
        <div className="lg:col-span-4">
          <div className="account-card h-full !p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative mb-8 flex items-center justify-center p-2">
              {/* Neural Pulse Glow */}
              <div className="absolute w-44 h-44 rounded-full bg-accent/20 blur-2xl neural-pulse-glow"></div>

              <svg
                className="w-40 h-40 transform -rotate-90 origin-center overflow-visible relative z-10"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="12"
                  strokeDasharray={402}
                  strokeDashoffset={402 - (402 * healthScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">
                  {healthScore}
                </span>
                <span className="text-[11px] font-bold text-text3 uppercase mt-1">
                  Health Score
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-text mb-3 flex items-center gap-2">
              Portfolio Stability
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            </h3>
            <p className="text-sm text-text2 leading-relaxed max-w-[280px] min-h-[40px] font-mono">
              {stabilityAdvice.text}
              <span className="inline-block w-1.5 h-4 bg-accent ml-1 animate-pulse"></span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6 relative overflow-hidden group">
          <div className="scan-line"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full relative z-10">
            <div className="account-card p-8 group hover:border-accent/30 transition-colors cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full"></div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Target size={24} />
                </div>
                <div
                  className={`text-[10px] font-bold px-3 py-1 rounded-full ${parseFloat(laRatio) < 0.2 ? 'bg-green/10 text-green border border-green/20' : 'bg-red/10 text-red border border-red/20'}`}
                >
                  {parseFloat(laRatio) < 0.2 ? 'OPTIMAL' : 'HIGH LEVERAGE'}
                </div>
              </div>
              <div className="text-[11px] font-black text-text3 uppercase tracking-[0.2em] mb-2">
                Leverage Ratio
              </div>
              <div className="text-5xl font-bold text-white font-mono tracking-tighter">
                {laRatio}x
              </div>
              <p className="text-[10px] text-text3 mt-4 leading-relaxed italic opacity-60 font-medium">
                Debt-to-Asset architecture efficiency
              </p>
            </div>

            <div className="account-card p-8 group hover:border-purple-500/30 transition-colors cursor-default">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <div className="text-[10px] font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  RESERVE
                </div>
              </div>
              <div className="text-[11px] font-black text-text3 uppercase tracking-[0.2em] mb-2">
                Liquidity Coverage
              </div>
              <div className="text-5xl font-bold text-white font-mono tracking-tighter">
                {((liquidAssets / (totalLiabilities || 1)) * 100).toFixed(0)}%
              </div>
              <p className="text-[10px] text-text3 mt-4 leading-relaxed italic opacity-60 font-medium">
                Emergency liability coverage capacity
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Asset Allocation (4) & Interest Efficiency (8) */}
        <div className="lg:col-span-4">
          <div className="account-card h-full !p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <PieChartIcon size={20} />
              </div>
              <h4 className="font-bold text-text uppercase text-xs tracking-widest">
                Asset Allocation
              </h4>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    }}
                    itemStyle={{
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-8">
              {allocationData.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    ></div>
                    <span className="text-[12px] font-bold text-text3 uppercase tracking-wider">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {((d.value / totalAssets) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="account-card h-full !p-8">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red/10 flex items-center justify-center text-red">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-text text-xl">
                    Interest Efficiency Audit
                  </h4>
                  <p className="text-[10px] text-text3 uppercase font-bold tracking-[0.15em] mt-1">
                    Capital Erosion Analysis
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                {
                  label: 'Credit Cards',
                  val: breakdown?.creditCardDebt,
                  rate: '36-42%',
                  color: 'border-accent',
                },
                {
                  label: 'Formal Loans',
                  val: breakdown?.formalLoans,
                  rate: '8-12%',
                  color: 'border-white/5',
                },
                {
                  label: 'Private Debt',
                  val: breakdown?.informalDebt,
                  rate: '0-18%',
                  color: 'border-white/5',
                },
              ].map((debt, i) => (
                <div
                  key={i}
                  className={`p-6 bg-white/[0.02] rounded-[24px] border ${debt.color} flex flex-col justify-between min-h-[140px] opacity-${debt.val > 0 ? '100' : '40 grayscale'}`}
                >
                  <div>
                    <div className="text-xs font-bold text-text2 mb-1">
                      {debt.label}
                    </div>
                    <div className="text-[9px] text-text3 font-black uppercase tracking-widest">
                      {debt.rate} APR
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {formatCurrency(debt.val)}
                  </div>
                </div>
              ))}
            </div>

            {totalLiabilities === 0 ? (
              <div className="p-10 bg-green/5 border border-green/10 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green text-black flex items-center justify-center mb-6 shadow-lg shadow-green/20">
                  <ShieldCheck size={32} />
                </div>
                <h5 className="font-extrabold text-white text-lg mb-2">
                  Maximum Efficiency Detected
                </h5>
                <p className="text-xs text-text2 max-w-sm leading-relaxed">
                  Your architecture is 100% interest-efficient. You are
                  currently losing ₹0 to financial institutions, allowing for
                  maximum compound growth.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-red/5 border border-red/10 rounded-2xl text-[11px] text-red font-medium">
                <Info size={14} />
                Strategic recommendation: Prioritize the liquidation of
                instruments with APR {`>`} 1.5% to improve efficiency.
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Forward Trajectory (12) */}
        <div className="lg:col-span-12 mt-4">
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-600/20 rounded-[40px] opacity-100 group-hover:scale-105 transition-transform duration-1000"></div>
            <div className="relative p-10 border border-white/5 rounded-[40px] backdrop-blur-2xl overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent/20 blur-[100px] rounded-full"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/30 rotate-3 group-hover:rotate-0 transition-transform">
                      <TrendingUp size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-2xl tracking-tight">
                        Q4 2026 Forecast
                      </h4>
                      <p className="text-[11px] text-accent font-black uppercase tracking-[0.25em] mt-1">
                        Growth Projection Engine
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-text3 uppercase tracking-[0.2em] opacity-60">
                      Estimated Net Worth
                    </div>
                    <div className="text-6xl font-black text-white font-mono tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
                      {formatCurrency(forecastedNW)}
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-[320px] bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                  <h5 className="text-[10px] font-black text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                    <BarChart3 size={12} />
                    Architect's Insight
                  </h5>
                  <p className="text-[12px] text-text2 leading-relaxed font-mono">
                    {marketInsight.text}
                    <span className="inline-block w-1.5 h-3 bg-accent ml-1 animate-pulse"></span>
                  </p>
                  <button
                    onClick={() => navigate('/net-worth')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white mt-6 group/btn"
                  >
                    Manage Portfolio{' '}
                    <ArrowRight
                      size={14}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time System Log Bar */}
        <div className="lg:col-span-12 mt-8 p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between pointer-events-none opacity-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text3">
                System Online
              </span>
            </div>
            <div className="w-[1px] h-3 bg-white/10"></div>
            <div className="text-[9px] font-mono text-text3 uppercase flex items-center gap-2">
              <span className="text-accent">$</span> architect_neural_engine
              --v1.0.4 --live_analysis
            </div>
          </div>
          <div className="text-[9px] font-mono text-text3 flex items-center gap-4">
            <span>PING: 14MS</span>
            <span>LOAD: 0.12%</span>
            <span>MEM: 24.3MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalysis;
