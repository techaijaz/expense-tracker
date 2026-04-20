import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Globe,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import api from '@/utils/httpMethods';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import useFormat from '../hooks/useFormat';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useFormat();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="loader-mini !w-8 !h-8"></div>
    </div>
  );
  
  if (!stats) return (
    <div className="p-8 text-center glass-panel rounded-2xl mx-6 mt-6">
      <div className="text-red text-4xl mb-4">
        <Activity size={48} className="mx-auto opacity-50" />
      </div>
      <h2 className="text-xl font-bold mb-2">Systems Offline</h2>
      <p className="text-text2">Failed to load statistics. Please check your connection or contact dev-ops.</p>
    </div>
  );

  const COLORS = ['#5B8DEF', '#2DD4A0', '#A78BFA', '#F5A623', '#22D3EE'];

  return (
    <div className="page-body space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-accent mb-1">
          <ShieldCheck size={18} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Administrative Override</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-text">Command Center</h1>
        <p className="text-text2 text-sm max-w-2xl">Real-time surveillance of ecosystem health, user growth, and financial throughput.</p>
      </div>

      {/* KPI Cards */}
      <div className="stat-row">
        <div className="kpi-card blue">
          <div className="kpi-icon blue">
            <Users size={18} />
          </div>
          <div className="kpi-label">Total Users</div>
          <div className="kpi-val">{stats.totalUsers.toLocaleString()}</div>
          <div className="kpi-change up">
            <ArrowUpRight size={14} />
            <span>12% over baseline</span>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon" style={{backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#A78BFA'}}>
            <ShieldCheck size={18} />
          </div>
          <div className="kpi-label">Pro License Nodes</div>
          <div className="kpi-val">{stats.proUsers.toLocaleString()}</div>
          <div className="kpi-change up">
            <ArrowUpRight size={14} />
            <span>8% conversion</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon green">
            <TrendingUp size={18} />
          </div>
          <div className="kpi-label">System Revenue</div>
          <div className="kpi-val">{formatAmount(stats.totalRevenue)}</div>
          <div className="kpi-change up">
            <ArrowUpRight size={14} />
            <span>15% growth</span>
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-icon amber">
            <Clock size={18} />
          </div>
          <div className="kpi-label">Pending Verifications</div>
          <div className="kpi-val">{stats.activePayments}</div>
          <div className="kpi-change neutral">
            <Activity size={14} />
            <span>Awaiting Review</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Acquisition Neural Map */}
        <div className="card glass-panel relative overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="card-title uppercase tracking-widest text-[11px] text-accent">Registration Pulse</h3>
              <p className="card-sub">Daily node creation over last 7 cycles</p>
            </div>
            <Activity className="text-accent opacity-20" size={20} />
          </div>
          
          <div className="h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.registrationTrend}>
                <defs>
                  <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B8DEF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5B8DEF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text3)', fontSize: 10, fontWeight: 600}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'var(--text3)', fontSize: 10, fontWeight: 600}} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: 'var(--text)', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '4px' }}
                  cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--accent)" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPulse)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Node Distribution */}
        <div className="card glass-panel">
          <div className="card-header">
            <div>
              <h3 className="card-title uppercase tracking-widest text-[11px] text-purple">Global Node Matrix</h3>
              <p className="card-sub">User distribution by geographical sector</p>
            </div>
            <Globe className="text-purple opacity-20" size={20} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 h-[280px]">
            <div className="relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.usersByCountry}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1500}
                  >
                    {stats.usersByCountry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-text3 font-bold">Total</div>
                  <div className="text-lg font-black text-text">{stats.totalUsers}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-3">
              {stats.usersByCountry.slice(0, 5).map((item, index) => (
                <div key={item._id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2.5 h-2.5 rounded-full ring-4 ring-bg2" 
                      style={{backgroundColor: COLORS[index % COLORS.length]}}
                    ></div>
                    <span className="text-xs font-semibold text-text2 group-hover:text-text transition-colors">
                      {item._id || 'Unknown Sector'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-12 bg-bg4 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-current opacity-30" 
                        style={{width: `${(item.count / stats.totalUsers) * 100}%`, color: COLORS[index % COLORS.length]}}
                      ></div>
                    </div>
                    <span className="text-[11px] font-bold text-text font-mono">
                      {((item.count / stats.totalUsers) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* System Status Footnote */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-border/10 opacity-30">
        <div className="flex items-center gap-1.5 grayscale">
          <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></div>
          <span className="text-[10px] font-bold tracking-widest uppercase">Nodes Operational</span>
        </div>
        <div className="w-1 h-3 bg-border2 rounded-full"></div>
        <div className="flex items-center gap-1.5 grayscale">
          <Clock size={12} />
          <span className="text-[10px] font-bold tracking-widest uppercase">Sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
