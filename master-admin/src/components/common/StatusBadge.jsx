const variants = {
  active:       { bg: '#dcfce7', color: '#16a34a' },
  Active:       { bg: '#dcfce7', color: '#16a34a' },
  inactive:     { bg: '#f3f4f6', color: '#6b7280' },
  Inactive:     { bg: '#f3f4f6', color: '#6b7280' },
  pending:      { bg: '#fef9c3', color: '#ca8a04' },
  Pending:      { bg: '#fef9c3', color: '#ca8a04' },
  processing:   { bg: '#dbeafe', color: '#2563eb' },
  Processing:   { bg: '#dbeafe', color: '#2563eb' },
  shipped:      { bg: '#e0e7ff', color: '#4f46e5' },
  Shipped:      { bg: '#e0e7ff', color: '#4f46e5' },
  delivered:    { bg: '#dcfce7', color: '#16a34a' },
  Delivered:    { bg: '#dcfce7', color: '#16a34a' },
  completed:    { bg: '#dcfce7', color: '#16a34a' },
  Completed:    { bg: '#dcfce7', color: '#16a34a' },
  cancelled:    { bg: '#fee2e2', color: '#dc2626' },
  Cancelled:    { bg: '#fee2e2', color: '#dc2626' },
  expired:      { bg: '#fee2e2', color: '#dc2626' },
  Expired:      { bg: '#fee2e2', color: '#dc2626' },
  expiring_soon:{ bg: '#fee2e2', color: '#d97706' },
  open:         { bg: '#fef9c3', color: '#ca8a04' },
  Open:         { bg: '#fef9c3', color: '#ca8a04' },
  resolved:     { bg: '#dcfce7', color: '#16a34a' },
  Resolved:     { bg: '#dcfce7', color: '#16a34a' },
  'in_progress':{ bg: '#dbeafe', color: '#2563eb' },
  'In Progress':{ bg: '#dbeafe', color: '#2563eb' },
  scheduled:    { bg: '#ede9fe', color: '#7c3aed' },
  Scheduled:    { bg: '#ede9fe', color: '#7c3aed' },
  assigned:     { bg: '#e0e7ff', color: '#4f46e5' },
  Assigned:     { bg: '#e0e7ff', color: '#4f46e5' },
  paid:         { bg: '#dcfce7', color: '#16a34a' },
  Paid:         { bg: '#dcfce7', color: '#16a34a' },
  'out_of_stock':{ bg: '#fee2e2', color: '#dc2626' },
  'Out of Stock':{ bg: '#fee2e2', color: '#dc2626' },
  new:          { bg: '#dbeafe', color: '#2563eb' },
  New:          { bg: '#dbeafe', color: '#2563eb' },
  draft:        { bg: '#f3f4f6', color: '#6b7280' },
  Draft:        { bg: '#f3f4f6', color: '#6b7280' },
  published:    { bg: '#dcfce7', color: '#16a34a' },
  Published:    { bg: '#dcfce7', color: '#16a34a' },
  sent:         { bg: '#dcfce7', color: '#16a34a' },
  Sent:         { bg: '#dcfce7', color: '#16a34a' },
  high:         { bg: '#fee2e2', color: '#dc2626' },
  High:         { bg: '#fee2e2', color: '#dc2626' },
  medium:       { bg: '#fef9c3', color: '#ca8a04' },
  Medium:       { bg: '#fef9c3', color: '#ca8a04' },
  low:          { bg: '#dcfce7', color: '#16a34a' },
  Low:          { bg: '#dcfce7', color: '#16a34a' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const style = variants[status] || { bg: '#f3f4f6', color: '#6b7280' }
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${padding}`}
      style={{ background: style.bg, color: style.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
      <span className="capitalize">{String(status).replace('_', ' ')}</span>
    </span>
  )
}
