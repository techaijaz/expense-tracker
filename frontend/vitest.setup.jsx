import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowDownLeft: () => <div data-testid="icon-arrow-down-left" />,
  ArrowUpRight: () => <div data-testid="icon-arrow-up-right" />,
  TrendingUp: () => <div data-testid="icon-trending-up" />,
  TrendingDown: () => <div data-testid="icon-trending-down" />,
}));



// Mock Shadcn UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
  CardHeader: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
  CardTitle: ({ children, className, ...props }) => <h3 className={className} {...props}>{children}</h3>,
  CardContent: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }) => <span className={className} {...props}>{children}</span>,
}));

// Mock hooks
vi.mock('@/hooks/useFormat', () => ({
  default: () => ({
    formatAmount: (val) => `$${val}`,
  }),
}));
