import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border2)',
        padding: '10px 14px',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <p style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
            <span style={{ color: 'var(--text2)' }}>{entry.name}:</span>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
              ₹{Number(entry.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CashFlowChart = ({ data }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Cash Flow</div>
          <div className="card-sub">Income vs Expenses · Last 6 months</div>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, alignItems: 'center' }}>
          <span style={{ color: 'var(--accent)' }}>■</span>Income{' '}
          <span style={{ color: 'var(--red)' }}>■</span>Expense
        </div>
      </div>

      <div className="chart-area" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="income" name="Income" fill="#5B8DEF" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="expense" name="Expense" fill="#FF6B6B" radius={[4, 4, 0, 0]} barSize={16} fillOpacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;
