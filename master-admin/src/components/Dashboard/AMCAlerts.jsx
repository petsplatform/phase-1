import { AlertTriangle } from 'lucide-react'
import SectionCard from './SectionCard'
import StatusBadge from '../common/StatusBadge'

export default function AMCAlerts({ data }) {
  return (
    <SectionCard title="Shipping & Restock Alerts" icon={AlertTriangle} iconColor="#d97706" badge={data.length}>
      <div className="p-4 space-y-3">
        {data.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.customer}</p>
              <p className="text-xs text-gray-500">{item.plan} - {item.product}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={item.status} size="xs" />
              <p className="text-[10px] text-gray-400 mt-1">Due: {item.endDate}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
