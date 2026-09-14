import { motion } from 'framer-motion'
import Card, { StatCard } from '../common/Card'
import { salesReport, orders } from '../../data/dummyData'
import { TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react'

const formatUSD = (value, options = {}) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  ...options,
}).format(Number(value || 0))

function SimpleBar({ month, revenue, max }) {
  const pct = Math.round((revenue / max) * 100)
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 flex flex-col items-center gap-1">
        <span className="text-[10px] text-gray-500 font-medium">{formatUSD(revenue, { notation: 'compact', compactDisplay: 'short' })}</span>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${pct * 1.2}px` }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full rounded-t-md"
          style={{ background: 'var(--primary)', opacity: 0.7 + pct / 333 }}
        />
        <span className="text-[10px] text-gray-400">{month}</span>
      </div>
    </div>
  )
}

export function SalesReportView() {
  const max = Math.max(...salesReport.monthly.map(m => m.revenue))
  const total = salesReport.monthly.reduce((s, m) => s + m.revenue, 0)
  const totalOrders = salesReport.monthly.reduce((s, m) => s + m.orders, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={formatUSD(total, { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 })} color="var(--primary)" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={totalOrders} color="#059669" />
        <StatCard icon={Package} label="Avg Order Value" value={formatUSD(Math.round(total / (totalOrders || 1)))} color="#7c3aed" />
        <StatCard icon={DollarSign} label="Best Month" value="Nov 23" sub={`${formatUSD(310000, { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 })} revenue`} color="#d97706" />
      </div>

      <Card>
        <h3 className="font-display font-semibold text-gray-800 mb-5">Monthly Revenue Trend</h3>
        <div className="flex items-end gap-3 h-48 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {salesReport.monthly.map(m => (
            <SimpleBar key={m.month} month={m.month} revenue={m.revenue} max={max} />
          ))}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Month</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Revenue</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Orders</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Units Sold</th>
              </tr>
            </thead>
            <tbody>
              {salesReport.monthly.map(m => (
                <tr key={m.month} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-3 py-2.5 text-gray-700 text-xs">{m.month}</td>
                  <td className="px-3 py-2.5 font-semibold text-xs">{formatUSD(m.revenue)}</td>
                  <td className="px-3 py-2.5 text-xs">{m.orders}</td>
                  <td className="px-3 py-2.5 text-xs">{m.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function PaymentReportView() {
  const paid = orders.filter(o => o.payment === 'Paid').reduce((s, o) => s + o.amount, 0)
  const pending = orders.filter(o => o.payment === 'Pending').reduce((s, o) => s + o.amount, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} label="Total Collected" value={formatUSD(paid)} color="#059669" />
        <StatCard icon={DollarSign} label="Pending Payments" value={formatUSD(pending)} color="#d97706" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={orders.length} color="var(--primary)" />
      </div>
      <Card>
        <h3 className="font-display font-semibold text-gray-800 mb-4">Payment Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-light)' }}>
                {['Order ID', 'Customer', 'Amount', 'Payment Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="px-4 py-3 text-xs font-mono text-blue-700">{o.id}</td>
                  <td className="px-4 py-3 text-xs">{o.customer}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{formatUSD(o.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.payment === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {o.payment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
