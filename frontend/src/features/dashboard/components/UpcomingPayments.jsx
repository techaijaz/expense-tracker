import React from 'react';
import dayjs from 'dayjs';
import useFormat from '@/hooks/useFormat';

const PaymentItem = ({ title, subtitle, amount, dueDate, formatAmount, formatDate }) => {
  // Defensive check for date requirements
  if (!dueDate) return null;

  const targetDate = dayjs(dueDate);
  if (!targetDate.isValid()) return null;

  const daysRemaining = targetDate.diff(dayjs(), 'day');
  const isUrgent = daysRemaining <= 3;
  const isSoon = daysRemaining <= 7;

  const chipClass =
    daysRemaining < 0 ? 'urgent' : isUrgent ? 'urgent' : isSoon ? 'soon' : 'ok';
  const chipLabel =
    daysRemaining < 0
      ? 'Overdue'
      : daysRemaining === 0
        ? 'Today'
        : `${daysRemaining} days`;

  return (
    <div className="upcoming-item">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>
          {subtitle || `Due ${formatDate(dueDate)} · ${formatAmount(amount)}`}
        </div>
      </div>
      <div className={`due-chip ${chipClass}`}>{chipLabel}</div>
    </div>
  );
};

export const UpcomingPayments = ({ payments }) => {
  const { formatAmount, formatDate } = useFormat();
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Upcoming Payments</div>
      </div>

      {payments.length > 0 ? (
        payments
          .slice(0, 5)
          .map((payment, index) => (
            <PaymentItem
              key={index}
              title={payment.name}
              subtitle={payment.subtitle}
              amount={payment.amount}
              dueDate={payment.dueDate}
              formatAmount={formatAmount}
              formatDate={formatDate}
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
          <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
          <p style={{ fontSize: 12 }}>No upcoming payments.</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingPayments;
