import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import SectionCard from './SectionCard'

const formatUSD = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0))
const formatDate = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function RevenueTrendChart({ data = [], loading }) {
  return (
    <SectionCard title="Revenue & Sales Trend" icon={TrendingUp}>
      <div className="p-4 sm:p-5 h-72">
        {loading ? (
          <div className="w-full h-full bg-gray-100 rounded-lg animate-pulse" />
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No data for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatUSD(v)} tick={{ fontSize: 11 }} width={70} />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value, name) => [name === 'revenue' ? formatUSD(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#revenueFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  )
}
