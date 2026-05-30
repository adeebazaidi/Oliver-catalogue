// =============================================
// CatalogueGen — Currency Manager
// =============================================

const CURRENCY_KEY = 'cataloguegen_currency';

let currentCurrency = typeof localStorage !== 'undefined' ? (localStorage.getItem(CURRENCY_KEY) || '$') : '$';

/**
 * Gets the current global currency symbol
 * @returns {string} Currency symbol (e.g., '$', '€', '£', '₹')
 */
export function getCurrencySymbol() {
  return currentCurrency;
}

/**
 * Sets the global currency symbol and persists it
 * @param {string} symbol 
 */
export function setCurrencySymbol(symbol) {
  currentCurrency = symbol;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CURRENCY_KEY, symbol);
  }
  // Dispatch a custom event so the UI can update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('currency-changed'));
  }
}

/**
 * Formats a number with the current currency symbol
 * @param {number} amount 
 * @returns {string} Formatted string (e.g. "$1,200")
 */
export function formatPrice(amount) {
  // Use toLocaleString to get nice comma grouping, then prepend the symbol
  return `${currentCurrency}${Number(amount).toLocaleString('en-US')}`;
}
