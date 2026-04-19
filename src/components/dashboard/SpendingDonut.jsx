import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import useFormat from '@/hooks/useFormat';

const COLORS = ['#FF6B6B', '#5B8DEF', '#2DD4A0', '#F5A623', '#A78BFA', '#22D3EE'];

const CustomTooltip = ({ active, payload, formatAmount }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border2)',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 12,
      }}>
        <p style={{ color: 'var(--text)', fontWeight: 600 }}>{payload[0].name}</p>
        <p style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
          {formatAmount(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const SpendingDonut = ({ data, total }) => {
  const { formatAmount } = useFormat();
  const hasData = data && data.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Spending by Category</div>
      </div>

      <div className="donut-wrap" style={{ flexDirection: 'column', gap: 12 }}>
        {/* Donut Chart */}
        {hasData ? (
          <div style={{ width: 100, height: 100, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip formatAmount={formatAmount} />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{
                fontFamily: 'var(--mono)',
                fontWeight: 700,
                fontSize: 11,
                color: 'var(--text)',
              }}>
                {formatAmount(total || 0)}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" width="100" height="100">
              <circle cx="50" cy="50" r="35" fill="none" stroke="var(--bg4)" strokeWidth="14" />
              <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="var(--text3)" fontSize="10" fontFamily="JetBrains Mono">{formatAmount(0)}</text>
            </svg>
          </div>
        )}

        {/* Legend with amounts */}
        <div className="donut-legend" style={{ width: '100%' }}>
          {(hasData ? data : []).slice(0, 4).map((entry, index) => (
            <div key={index} className="legend-item">
              <div
                className="legend-dot"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              <span style={{ flex: 1, fontSize: 12 }}>{entry.name}</span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--text)',
              }}>
                {formatAmount(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpendingDonut;
