export const CURRENCY_MAP = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
};

export const getCurrencySymbol = (code) => CURRENCY_MAP[code] || '$';

/**
 * Formats a number as a currency string.
 * @param {number} amount - The numeric value to format.
 * @param {string} currency - The currency code (e.g., 'INR', 'USD').
 * @param {number} precision - Number of decimal places.
 * @returns {string} - Formatted currency string.
 */
export const formatAmount = (amount, currency = 'INR', precision = 2) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid or not supported
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${Number(amount).toFixed(precision)}`;
  }
};

/**
 * Restricts the number of decimal places in a string value.
 * Useful for controlled inputs.
 * @param {string} value - The input value.
 * @param {number} decimalPlaces - Max decimal places allowed.
 * @returns {string} - Truncated or original value.
 */
export const restrictDecimals = (value, decimalPlaces = 2) => {
  if (!value || decimalPlaces === undefined) return value;
  
  const parts = value.toString().split('.');
  if (parts.length > 1 && parts[1].length > decimalPlaces) {
    return parts[0] + '.' + parts[1].slice(0, decimalPlaces);
  }
  return value;
};
