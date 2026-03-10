export function formatCurrency(value) {
  const num = typeof value === 'number' ? value : Number(value || 0);
  const formatted = new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `₵${formatted}`;
}
