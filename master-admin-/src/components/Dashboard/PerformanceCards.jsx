import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Loader2, RotateCcw, Receipt, UserPlus, TrendingUp } from 'lucide-react'
import KpiCard from './KpiCard'

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } },
}

const formatUSD = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function PerformanceCards({ summary, loading }) {
  const statusCounts = summary?.orderStatusCounts || {}
  const revenue = summary?.revenue || {}
  const refunds = summary?.refunds || {}

  const cards = [
    { icon: CheckCircle2, label: 'Delivered Orders', value: statusCounts.delivered, color: '#059669' },
    { icon: Loader2, label: 'Processing Orders', value: statusCounts.processing, color: '#7c3aed' },
    { icon: Clock, label: 'Pending Orders', value: statusCounts.pending, color: '#d97706' },
    { icon: Receipt, label: 'Monthly Revenue', value: loading ? undefined : formatUSD(revenue.monthly), sub: revenue.changePct != null ? `${revenue.changePct > 0 ? '▲' : '▼'} ${Math.abs(revenue.changePct)}% vs last month` : 'No prior month data', color: '#059669' },
      // { icon: TrendingUp, label: 'Avg. Order Value', value: loading ? undefined : formatUSD(summary?.averageOrderValue), color: 'var(--primary)' },
      // { icon: RotateCcw, label: 'Refunds', value: loading ? undefined : `${refunds.count || 0} · ${formatUSD(refunds.amount)}`, color: '#dc2626' },
      // { icon: XCircle, label: 'Cancelled Orders', value: statusCounts.cancelled, color: '#dc2626' },
      // { icon: UserPlus, label: 'New Customers (Month)', value: summary?.newCustomersThisMonth, color: '#0891b2' },
  ]

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="visible" className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => (
        <motion.div key={card.label} variants={stagger.item}>
          <KpiCard {...card} loading={loading} />
        </motion.div>
      ))}
    </motion.div>
  )
}
