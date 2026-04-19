import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import { 
  Calendar, Download, TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownRight, Printer, FileText, FileSpreadsheet,
  ChevronDown, Loader2, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/httpMethods';
import useFormat from '@/hooks/useFormat';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const Reports = () => {
  const { formatAmount, preferences } = useFormat();
  const fyLabel = preferences.fiscalYear === 'January-December' ? 'FY (Jan-Dec)' : 'FY (Apr-Mar)';

  const [activeTab, setActiveTab] = useState('Overview');
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState({
    overview: null,
    categories: [],
    trend: []
  });

  const periods = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'fy', label: fyLabel }
  ];

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Determine what type of categories to fetch based on tab
      let type = 'expense';
      if (activeTab === 'Income') type = 'income';
      
      const [overviewRes, categoriesRes, trendRes] = await Promise.all([
        api.get(`/reports/overview?period=${period}`),
        api.get(`/reports/categories?period=${period}&type=${type}`),
        api.get(`/reports/trend?period=${period}`)
      ]);

      setData({
        overview: overviewRes.data,
        categories: categoriesRes.data || [],
        trend: trendRes.data || []
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period, activeTab]);

  const handleExport = async (type) => {
    setExporting(true);
    toast.info(`Generating ${type.toUpperCase()} report...`);
    try {
      const response = await api.post('/reports/export', { type, period });
      if (response.success) {
        toast.success(`Report zipped and emailed successfully!`);
      } else {
        toast.error(response.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('An error occurred during export');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => formatAmount(amount, null, 0);

  if (loading && !data.overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
        <p className="text-text2 font-medium">Analyzing financial data...</p>
      </div>
    );
  }

  const { currentMonth, comparison } = data.overview || {};

  const getActivePeriodLabel = () => periods.find(p => p.id === period)?.label || 'Monthly';

  return (
    <div className="page-body">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text mb-1">Reports & Analytics</h1>
          <p className="text-text2 text-sm">Visualizing your financial ecosystem</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Combined Period Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn-outline gap-2 min-w-[140px]">
                <Calendar className="w-4 h-4 text-accent" />
                {getActivePeriodLabel()}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-bg2 border-border text-text min-w-[160px]">
              {periods.map((p) => (
                <DropdownMenuItem 
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`cursor-pointer gap-2 ${period === p.id ? 'text-accent font-bold bg-accent-glow' : 'text-text2'}`}
                >
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn-primary gap-2 min-w-[120px]" disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-bg2 border-border text-text">
              <DropdownMenuItem 
                onClick={() => handleExport('csv')}
                className="gap-2 cursor-pointer focus:bg-accent-glow focus:text-accent"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV (Email)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExport('pdf')}
                className="gap-2 cursor-pointer focus:bg-accent-glow focus:text-accent"
              >
                <FileText className="w-4 h-4" />
                Export PDF (Email)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <div className="report-tabs mb-8 inline-flex">
        {['Overview', 'Income', 'Expense', 'Savings', 'Cash Flow'].map((tab) => (
          <div
            key={tab}
            className={`report-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(activeTab === 'Overview' || activeTab === 'Income') && (
          <div className="insight-card group hover:border-green transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="insight-label">Total Income</div>
              <div className="p-2 bg-green-bg rounded-lg text-green">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="insight-val text-green mb-1">{formatCurrency(currentMonth?.income || 0)}</div>
            <div className={`flex items-center gap-1 text-[11px] font-medium ${comparison?.incomeChange >= 0 ? 'text-green' : 'text-red'}`}>
              {comparison?.incomeChange >= 0 ? '+' : ''}{comparison?.incomeChange}% vs last {period}
            </div>
          </div>
        )}

        {(activeTab === 'Overview' || activeTab === 'Expense') && (
          <div className="insight-card group hover:border-red transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="insight-label">Total Expenses</div>
              <div className="p-2 bg-red-bg rounded-lg text-red">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <div className="insight-val text-red mb-1">{formatCurrency(currentMonth?.expense || 0)}</div>
            <div className={`flex items-center gap-1 text-[11px] font-medium ${comparison?.expenseChange <= 0 ? 'text-green' : 'text-red'}`}>
              {comparison?.expenseChange > 0 ? '+' : ''}{comparison?.expenseChange}% vs last {period}
            </div>
          </div>
        )}

        {(activeTab === 'Overview' || activeTab === 'Savings' || activeTab === 'Cash Flow') && (
          <div className="insight-card group hover:border-accent transition-colors duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="insight-label">{activeTab === 'Cash Flow' ? 'Net Cash Flow' : 'Net Savings'}</div>
              <div className="p-2 bg-accent-glow rounded-lg text-accent">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="insight-val text-accent mb-1">{formatCurrency(currentMonth?.savings || 0)}</div>
            <div className="insight-sub leading-tight">
              <span className="font-bold text-text">
                {currentMonth?.income > 0 ? Math.round((currentMonth.savings / currentMonth.income) * 100) : 0}%
              </span> savings rate for this {period}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Main Trend Chart */}
        <div className="card h-full min-h-[400px] flex flex-col">
          <div className="card-header border-b border-border pb-4 mb-6">
            <div className="card-title">
              {activeTab} Trend
            </div>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider font-bold">
              {(activeTab === 'Overview' || activeTab === 'Income' || activeTab === 'Cash Flow') && (
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent"></span> Income</div>
              )}
              {(activeTab === 'Overview' || activeTab === 'Expense' || activeTab === 'Cash Flow') && (
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red opacity-70"></span> Expense</div>
              )}
              {activeTab === 'Savings' && (
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple"></span> Savings</div>
              )}
            </div>
          </div>
          <div className="flex-1 w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'Savings' ? (
                <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg2)', borderColor: 'var(--border)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
                  <Area type="monotone" dataKey={(val) => val.income - val.expense} name="Savings" stroke="var(--purple)" fillOpacity={1} fill="url(#colorSavings)" />
                </AreaChart>
              ) : (
                <BarChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg4)', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'var(--bg2)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  {(activeTab === 'Overview' || activeTab === 'Income' || activeTab === 'Cash Flow') && (
                    <Bar dataKey="income" name="Income" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={period === 'monthly' ? 12 : 30} />
                  )}
                  {(activeTab === 'Overview' || activeTab === 'Expense' || activeTab === 'Cash Flow') && (
                    <Bar dataKey="expense" name="Expense" fill="var(--red)" fillOpacity={0.7} radius={[4, 4, 0, 0]} barSize={period === 'monthly' ? 12 : 30} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories for Current Tab */}
        {(activeTab === 'Overview' || activeTab === 'Income' || activeTab === 'Expense') ? (
          <div className="card h-full flex flex-col">
            <div className="card-header border-b border-border pb-4 mb-6">
              <div className="card-title">Top {activeTab === 'Income' ? 'Income' : 'Spending'} Categories</div>
            </div>
            <div className="top-cats flex-1 flex flex-col gap-6">
              {data.categories.length > 0 ? (
                data.categories.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold font-mono text-text3 opacity-50">0{idx + 1}</span>
                        <span className="text-sm font-semibold text-text2 uppercase tracking-wide">{cat.categoryName}</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-text">{formatCurrency(cat.totalAmount)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-bg4 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${cat.percentageOfTotal}%`, 
                          backgroundColor: activeTab === 'Income' ? 'var(--green)' : 
                                         idx === 0 ? 'var(--red)' : 
                                         idx === 1 ? 'var(--amber)' : 
                                         idx === 2 ? 'var(--purple)' : 
                                         idx === 3 ? 'var(--green)' : 'var(--teal)' 
                        }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-text3 font-medium flex gap-1 items-center">
                      <TrendingDown className="w-3 h-3" />
                      {cat.percentageOfTotal}% of total {activeTab === 'Income' ? 'income' : 'spending'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-text3 gap-2 py-10">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p>No category data for this period</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card h-full flex flex-col p-8 items-center justify-center text-center">
            <div className="w-16 h-16 bg-accent-glow rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-text mb-2">{activeTab} Analysis</h3>
            <p className="text-sm text-text2 max-w-[280px]">Detailed category breakdowns are available in the Income and Expense tabs. Use this view to monitor net performance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
