import React from 'react';
import { useNavigate } from 'react-router-dom';

// Category emoji mapping
const CAT_ICONS = {
  food: '🍕', transport: '🚗', shopping: '🛒', bills: '⚡',
  health: '🏥', entertainment: '🎬', salary: '💼', work: '💼',
  education: '📚', travel: '✈️', subscriptions: '📱',
};

function getCatIcon(name = '') {
  const key = name.toLowerCase();
  for (const [k, icon] of Object.entries(CAT_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return '💳';
}

function getBarColor(pct) {
  if (pct >= 100) return 'var(--red)';
  if (pct >= 80)  return 'var(--amber)';
  return 'var(--green)';
}

const BudgetItem = ({ name, spent, total }) => {
  const rawPct = total > 0 ? Math.round((spent / total) * 100) : 0;
  const pct = Math.min(rawPct, 110); // allow slight overflow visual
  const barWidth = Math.min(rawPct, 100);
  const color = getBarColor(rawPct);
  const icon = getCatIcon(name);

  return (
    <div className="budget-mini-row">
      <span className="budget-mini-label">{icon} {name}</span>
      <div className="budget-mini-bar">
        <div
          className="budget-mini-fill"
          style={{ width: `${barWidth}%`, background: color }}
        />
      </div>
      <span className="budget-mini-pct" style={{ color }}>{rawPct}%</span>
    </div>
  );
};

export const BudgetOverview = ({ budgets }) => {
  const navigate = useNavigate();

  const totalSpent = budgets.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const totalLimit = budgets.reduce((s, b) => s + (b.limit || 0), 0);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Budget Overview</div>
        </div>
        <span className="card-link" onClick={() => navigate('/budget')} style={{ cursor: 'pointer' }}>
          Manage →
        </span>
      </div>

      {budgets.length > 0 ? (
        <>
          {budgets.slice(0, 5).map((budget, index) => (
            <BudgetItem
              key={index}
              name={budget.categoryName}
              spent={budget.totalAmount}
              total={budget.limit}
            />
          ))}

          {/* Total footer row */}
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
          }}>
            <span style={{ color: 'var(--text2)' }}>Total spent</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>
              ₹{totalSpent.toLocaleString()}{' '}
              <span style={{ color: 'var(--text2)' }}>/ ₹{totalLimit.toLocaleString()}</span>
            </span>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--text3)', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
          <p style={{ fontSize: 12 }}>No active budgets found.</p>
        </div>
      )}
    </div>
  );
};

export default BudgetOverview;
