import { describe, it, expect } from 'vitest';
import { cn, formatDate } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges tailwind classes correctly', () => {
      expect(cn('bg-red-500', 'p-4')).toBe('bg-red-500 p-4');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('handles conditional classes', () => {
      expect(cn('p-4', true && 'm-2', false && 'hidden')).toBe('p-4 m-2');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly with default format', () => {
      const date = '2024-01-01';
      expect(formatDate(date)).toBe('01-01-2024');
    });

    it('formats date correctly with custom format', () => {
      const date = '2024-01-01';
      expect(formatDate(date, 'YYYY/MM/DD')).toBe('2024/01/01');
    });

    it('returns em-dash for null or undefined date', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });

    it('returns em-dash for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('—');
    });
  });
});
