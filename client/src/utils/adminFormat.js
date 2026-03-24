import { planAccentMap, statusAccentMap } from './adminConstants';

export function formatMoney(value = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatNumber(value = 0) {
  return Number(value || 0).toLocaleString('en-IN');
}

export function formatDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(value) {
  if (!value) return 'Never';

  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(value);
}

export function toInputDate(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

export function getUsagePct(used = 0, limit = 0) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function isExpiringSoon(value, windowDays = 7) {
  if (!value) return false;

  const diff = new Date(value).getTime() - Date.now();
  return diff > 0 && diff < windowDays * 24 * 60 * 60 * 1000;
}

export function hasBillingFilters(filters = {}) {
  return Boolean(
    filters.dateFrom
    || filters.dateTo
    || (filters.planName && filters.planName !== 'ALL')
    || (filters.status && filters.status !== 'ALL'),
  );
}

export function getStatusTone(status) {
  const accent = statusAccentMap[status] || '#9ca3af';
  return {
    accent,
    background: `${accent}1f`,
  };
}

export function getPlanTone(plan) {
  const accent = planAccentMap[plan] || '#c67c4e';
  return {
    accent,
    background: `${accent}1f`,
  };
}

export function buildInvoiceHtml(invoice) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${invoice.invoiceNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #1b1410; }
      .wrap { max-width: 720px; margin: 0 auto; border: 1px solid #e0ccba; border-radius: 16px; padding: 28px; }
      h1 { margin: 0 0 8px; }
      .muted { color: #7c5e49; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      td { padding: 10px 0; border-bottom: 1px solid #efe1d4; }
      td:first-child { color: #7c5e49; width: 38%; }
      .total { font-size: 24px; font-weight: 700; color: #c67c4e; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <div class="muted">CafeOS Super Admin Billing Export</div>
      <table>
        <tr><td>Tenant</td><td>${invoice.tenantName}</td></tr>
        <tr><td>Plan</td><td>${invoice.planName}</td></tr>
        <tr><td>Status</td><td>${invoice.status}</td></tr>
        <tr><td>Billing Date</td><td>${formatDate(invoice.billingDate)}</td></tr>
        <tr><td>Payment Method</td><td>${invoice.paymentMethod || '—'}</td></tr>
        <tr><td>Next Billing</td><td>${formatDate(invoice.nextBillingDate)}</td></tr>
        <tr><td>Notes</td><td>${invoice.notes || '—'}</td></tr>
      </table>
      <div style="margin-top: 24px;">Total Due</div>
      <div class="total">${formatMoney(invoice.amount)}</div>
    </div>
  </body>
</html>`;
}

export function downloadTextFile({ filename, content, type = 'text/plain;charset=utf-8' }) {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
