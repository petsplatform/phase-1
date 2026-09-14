import { AlertTriangle } from 'lucide-react'
import SectionCard from './SectionCard'
import MiniTable from './MiniTable'

export default function LowStockAlerts({ products = [], loading }) {
  return (
    <SectionCard title="Low Stock Alerts" icon={AlertTriangle} iconColor="#dc2626" badge={loading ? undefined : products.length}>
      {loading ? (
        <div className="p-5 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : (
        <MiniTable
          rows={products}
          emptyMsg="No low stock products"
          cols={[
            { key: 'name', label: 'Product' },
            { key: 'sku', label: 'SKU' },
            { key: 'stock', label: 'Stock Left', render: (v) => <span className="font-semibold text-red-600">{v}</span> },
          ]}
        />
      )}
    </SectionCard>
  )
}
