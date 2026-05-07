import { describe, it, expect } from 'vitest';
import { formatAmount, restrictDecimals, getCurrencySymbol } from './format';

describe('format utils', () => {
  describe('getCurrencySymbol', () => {
    it('returns correct symbol for known codes', () => {
      expect(getCurrencySymbol('INR')).toBe('₹');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('returns default symbol for unknown codes', () => {
      expect(getCurrencySymbol('XYZ')).toBe('$');
    });
  });

  describe('formatAmount', () => {
    it('formats INR correctly', () => {
      // Note: Intl.NumberFormat might use non-breaking spaces or different characters depending on environment
      // We check if it contains the symbol and the value
      const result = formatAmount(1000, 'INR', 2);
      expect(result).toMatch(/₹/);
      expect(result).toMatch(/1,000.00/);
    });

    it('formats USD correctly', () => {
      const result = formatAmount(1000, 'USD', 2, 'en-US');
      expect(result).toBe('$1,000.00');
    });

    it('respects precision', () => {
      const result = formatAmount(1000, 'USD', 0, 'en-US');
      expect(result).toBe('$1,000');
    });
  });

  describe('restrictDecimals', () => {
    it('restricts decimals correctly', () => {
      expect(restrictDecimals('10.123', 2)).toBe('10.12');
      expect(restrictDecimals('10.1', 2)).toBe('10.1');
      expect(restrictDecimals('10', 2)).toBe('10');
    });

    it('handles no decimal places', () => {
      expect(restrictDecimals('10.123', 0)).toBe('10.');
    });
  });
});
