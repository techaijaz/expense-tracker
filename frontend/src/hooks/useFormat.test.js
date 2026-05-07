import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import useFormat from './useFormat';

// Unmock the hook if it was mocked in vitest.setup.jsx
vi.unmock('@/hooks/useFormat');

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

describe('useFormat hook', () => {
  it('returns default values when user is not logged in', () => {
    useSelector.mockReturnValue({ user: null });
    
    const { result } = renderHook(() => useFormat());
    
    expect(result.current.currency).toBe('INR');
    expect(result.current.decimalPlaces).toBe(2);
    expect(result.current.dateFormat).toBe('DD/MM/YYYY');
  });

  it('returns user preferences when available', () => {
    useSelector.mockReturnValue({
      user: {
        preferences: {
          currency: 'USD',
          decimalPlaces: 3,
          dateFormat: 'YYYY-MM-DD'
        }
      }
    });
    
    const { result } = renderHook(() => useFormat());
    
    expect(result.current.currency).toBe('USD');
    expect(result.current.decimalPlaces).toBe(3);
    expect(result.current.dateFormat).toBe('YYYY-MM-DD');
  });

  it('formats amount using user preferences', () => {
    useSelector.mockReturnValue({
      user: {
        preferences: {
          currency: 'USD',
          decimalPlaces: 2
        }
      }
    });
    
    const { result } = renderHook(() => useFormat());
    const formatted = result.current.formatAmount(1000);
    
    expect(formatted).toBe('$1,000.00');
  });

  it('allows overriding currency and precision', () => {
    useSelector.mockReturnValue({
      user: {
        preferences: {
          currency: 'USD',
          decimalPlaces: 2
        }
      }
    });
    
    const { result } = renderHook(() => useFormat());
    const formatted = result.current.formatAmount(1000, 'EUR', 0);
    
    // Note: Locale is hardcoded to en-IN in baseFormatAmount if not provided, 
    // but Intl.NumberFormat(undefined) uses system locale.
    // In Vitest JSDOM it might be en-US or similar.
    expect(formatted).toMatch(/€/);
    expect(formatted).toMatch(/1,000/);
  });
});
