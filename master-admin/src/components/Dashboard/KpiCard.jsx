import { motion } from 'framer-motion'

// Reusable KPI card: shows a skeleton while loading and a muted dash when there's no data.
export default function KpiCard({ icon: Icon, label, value, sub, color = 'var(--primary)', loading = false }) {
  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl border p-4 sm:p-5 h-full min-w-0 animate-pulse" style={{ borderColor: 'var(--border-color)' }}>
        <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
        <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-2.5 w-16 bg-gray-100 rounded" />
      </div>
    )
  }

  const isEmpty = value === null || value === undefined || value === '—'

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 16px 38px rgba(23,52,95,0.12)' }}
      transition={{ duration: 0.2 }}
      className="bg-[var(--card-bg)] rounded-xl border p-4 sm:p-5 flex items-start justify-between cursor-default h-full min-w-0"
      style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--admin-shadow)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium mb-1 truncate">{label}</p>
        <p className={`text-xl sm:text-2xl font-display font-bold truncate ${isEmpty ? 'text-[var(--text-soft)]' : 'text-[var(--text-primary)]'}`}>
          {isEmpty ? '—' : value}
        </p>
        {sub && <p className="text-xs text-[var(--text-soft)] mt-1 truncate">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ml-3" style={{ background: `${color}18` }}>
          <Icon size={19} style={{ color }} />
        </div>
      )}
    </motion.div>
  )
}
