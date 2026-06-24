// Indian-locale formatting helpers.

// ₹1,23,456 — Indian digit grouping (lakh/crore) with no decimals by default.
export function formatINR(amount, { decimals = 0 } = {}) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

export function discountPercent(price, mrp) {
  if (!mrp || mrp <= price) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}
