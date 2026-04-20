import React from 'react';
import { useNavigate } from 'react-router-dom';
import useFormat from '@/hooks/useFormat';

// Map transaction type → icon + colors matching reference design
const TYPE_STYLES = {
  income: { icon: '💼', bg: 'var(--green-bg)', color: 'var(--green)' },
  expense: { icon: '🛒', bg: 'var(--red-bg)', color: 'var(--red)' },
  transfer: { icon: '🔄', bg: 'var(--purple-bg)', color: 'var(--purple)' },
  debt: { icon: '🤝', bg: 'var(--amber-bg)', color: 'var(--amber)' },
  repayment: { icon: '💸', bg: 'var(--accent-glow)', color: 'var(--accent)' },
};

// Category icon mapping for richer display
const CAT_ICONS = {
  food: '🍕',
  transport: '⛽',
  work: '💼',
  salary: '💼',
  shopping: '🛒',
  bills: '⚡',
  health: '🏥',
  entertainment: '🎬',
  transfer: '🔄',
  udhar: '🤝',
};

function getCategoryIcon(categoryName = '') {
  const key = categoryName.toLowerCase();
  for (const [k, icon] of Object.entries(CAT_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return '💳';
}

const TransactionItem = ({
  desc,
  type,
  categoryName,
  account,
  amount,
  date,
  formatAmount,
}) => {
  const style = TYPE_STYLES[type] || TYPE_STYLES.expense;
  const isCredit = type === 'income' || type === 'repayment';
  const catIcon = getCategoryIcon(categoryName);

  return (
    <div className="mini-txn">
      <div
        className="mini-txn-icon"
        style={{ background: style.bg, color: style.color }}
      >
        {catIcon}
      </div>
      <div className="mini-txn-desc">
        {desc}
        <div className="mini-txn-sub">
          {account || 'Account'} · {categoryName || type}
        </div>
      </div>
      <div
        className="mini-txn-amt"
        style={{
          color: isCredit
            ? 'var(--green)'
            : type === 'transfer'
              ? 'var(--text2)'
              : 'var(--red)',
        }}
      >
        {isCredit ? '+' : '-'}
        {formatAmount(amount)}
      </div>
    </div>
  );
};

export const RecentTransactionsMini = ({ transactions, onViewAll }) => {
  const navigate = useNavigate();
  const { formatAmount } = useFormat();
  const handleViewAll = onViewAll || (() => navigate('/transactions'));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Recent Transactions</div>
        </div>
        <span
          className="card-link"
          onClick={handleViewAll}
          style={{ cursor: 'pointer' }}
        >
          View all →
        </span>
      </div>

      {transactions.length > 0 ? (
        transactions
          .slice(0, 5)
          .map((txn) => (
            <TransactionItem
              key={txn._id}
              desc={txn.description}
              type={txn.type}
              categoryName={txn.categoryName}
              account={txn.accountName}
              amount={txn.amount}
              date={txn.date}
              formatAmount={formatAmount}
            />
          ))
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 0',
            color: 'var(--text3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>💸</div>
          <p style={{ fontSize: 12 }}>No recent transactions.</p>
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsMini;
