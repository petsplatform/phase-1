import { Trophy } from 'lucide-react'
import SectionCard from './SectionCard'
import MiniTable from './MiniTable'

const formatUSD = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function TopProducts({ products = [], loading }) {
  return (
    <SectionCard title="Best Selling Products" icon={Trophy} badge={loading ? undefined : products.length}>
      {loading ? (
        <div className="p-5 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : (
        <MiniTable
          rows={products}
          emptyMsg="No sales in this range"
          cols={[
            { key: 'name', label: 'Product' },
            { key: 'sku', label: 'SKU' },
            { key: 'quantitySold', label: 'Units Sold' },
            { key: 'price', label: 'Price', render: (v) => formatUSD(v) },
          ]}
        />
      )}
    </SectionCard>
  )
}
