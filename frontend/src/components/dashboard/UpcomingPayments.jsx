import React from 'react';
import { differenceInDays, format } from 'date-fns';
import useFormat from '@/hooks/useFormat';

const PaymentItem = ({ title, subtitle, amount, dueDate, formatAmount }) => {
  const daysRemaining = differenceInDays(new Date(dueDate), new Date());
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
          {subtitle || `Due · ${formatAmount(amount)}`}
        </div>
      </div>
      <div className={`due-chip ${chipClass}`}>{chipLabel}</div>
    </div>
  );
};

export const UpcomingPayments = ({ payments }) => {
  const { formatAmount } = useFormat();
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
