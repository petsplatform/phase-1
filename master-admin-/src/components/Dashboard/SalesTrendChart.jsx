import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'
import SectionCard from './SectionCard'

const formatDate = (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function SalesTrendChart({ data = [], loading }) {
  return (
    <SectionCard title="Orders Trend" icon={BarChart3}>
      <div className="p-4 sm:p-5 h-72">
        {loading ? (
          <div className="w-full h-full bg-gray-100 rounded-lg animate-pulse" />
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No data for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: '#374151' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#374151' }} width={30} />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value) => [value, 'Orders']}
                contentStyle={{ color: '#111827', fontSize: 12 }}
                labelStyle={{ color: '#111827', fontWeight: 600 }}
                itemStyle={{ color: '#374151' }}
              />
              <Bar dataKey="orders" fill="var(--accent-gold-soft, #d4af37)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  )
}
