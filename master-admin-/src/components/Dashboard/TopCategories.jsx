import { Tags } from 'lucide-react'
import SectionCard from './SectionCard'
import MiniTable from './MiniTable'

export default function TopCategories({ categories = [], loading }) {
  return (
    <SectionCard title="Top Categories" icon={Tags} badge={loading ? undefined : categories.length}>
      {loading ? (
        <div className="p-5 space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : (
        <MiniTable
          rows={categories}
          emptyMsg="No sales in this range"
          cols={[
            { key: 'category', label: 'Category' },
            { key: 'quantitySold', label: 'Units Sold' },
          ]}
        />
      )}
    </SectionCard>
  )
}
