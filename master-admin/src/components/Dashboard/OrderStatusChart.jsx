import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import SectionCard from './SectionCard'

const STATUS_COLORS = {
  Pending: '#d97706',
  Confirmed: '#0891b2',
  Processing: '#7c3aed',
  Shipped: '#2563eb',
  Delivered: '#059669',
  Cancelled: '#dc2626',
}

export default function OrderStatusChart({ counts, loading }) {
  const data = Object.entries(counts || {})
    .map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value }))
    .filter((entry) => entry.value > 0)

  return (
    <SectionCard title="Order Status Breakdown" icon={PieIcon}>
      <div className="p-4 sm:p-5 h-72">
        {loading ? (
          <div className="w-full h-full bg-gray-100 rounded-lg animate-pulse" />
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No orders for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  )
}
