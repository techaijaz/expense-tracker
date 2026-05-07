import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TransactionSummary from './TransactionSummary';

describe('TransactionSummary', () => {
  const defaultProps = {
    inflow: 1000,
    outflow: 400,
    netPrecision: 600,
    totalRecords: 10,
    overview: {
      comparison: {
        incomeChange: 10,
        expenseChange: -5,
        savingsChange: 15,
      },
    },
  };

  it('renders correctly with given financial data', () => {
    render(<TransactionSummary {...defaultProps} />);

    // Check inflow
    expect(screen.getByText('Total Inflow')).toBeInTheDocument();
    expect(screen.getByText('$1000')).toBeInTheDocument();

    // Check outflow
    expect(screen.getByText('Total Outflow')).toBeInTheDocument();
    expect(screen.getByText('$400')).toBeInTheDocument();

    // Check net precision
    expect(screen.getByText('Net Precision')).toBeInTheDocument();
    expect(screen.getByText('+$600')).toBeInTheDocument();
  });

  it('displays the correct badges based on net flow', () => {
    const { rerender } = render(<TransactionSummary {...defaultProps} />);
    expect(screen.getByText('Surplus')).toBeInTheDocument();

    rerender(<TransactionSummary {...defaultProps} netPrecision={-100} />);
    expect(screen.getByText('Deficit')).toBeInTheDocument();
  });

  it('shows trends when overview data is provided', () => {
    render(<TransactionSummary {...defaultProps} />);
    
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
  });
});
