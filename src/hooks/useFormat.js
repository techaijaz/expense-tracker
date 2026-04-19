import { useSelector } from 'react-redux';
import { formatAmount as baseFormatAmount } from '@/utils/format';
import { formatDate as baseFormatDate } from '@/utils/utils';

/**
 * Custom hook to provide formatting functions synchronized with user preferences.
 */
export default function useFormat() {
  const { user } = useSelector((state) => state.auth);
  
  // Support both nested and direct structures safely
  const preferences = user?.user?.preferences || user?.preferences || {};
  
  const currency = preferences.currency || 'INR';
  const decimalPlaces = preferences.decimalPlaces ?? 2;
  const dateFormat = preferences.dateFormat || 'DD/MM/YYYY';

  /**
   * Formats an amount using the user's currency and decimal preferences.
   */
  const formatAmount = (amount, overrideCurrency, overridePrecision) => {
    return baseFormatAmount(
      amount, 
      overrideCurrency || currency, 
      overridePrecision ?? decimalPlaces
    );
  };

  /**
   * Formats a date using the user's date format preference.
   */
  const formatDate = (date, overrideFormat) => {
    // dayjs uses different tokens than what might be in the dropdown
    // Ensuring consistency: YYYY-MM-DD, DD/MM/YYYY etc.
    return baseFormatDate(date, overrideFormat || dateFormat);
  };

  return {
    formatAmount,
    formatDate,
    preferences,
    currency,
    decimalPlaces,
    dateFormat,
  };
}
