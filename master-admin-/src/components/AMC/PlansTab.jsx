import { Plus, Edit2, Trash2 } from 'lucide-react'
import Card from '../common/Card'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import { amcPlans } from '../../data/dummyData'

const formatUSD = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

export default function PlansTab() {
  const columns = [
    { key: 'name', label: 'Plan Name' },
    { key: 'duration', label: 'Duration' },
    { key: 'price', label: 'Price', render: (v) => formatUSD(v) },
    { key: 'services', label: 'Dispatch Windows' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'id', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors" title="Edit Plan">
            <Edit2 size={15} />
          </button>
          <button onClick={() => alert(`Delete plan ${row.id} (Mock)`)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors" title="Delete Plan">
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ]

  return (
    <Card>
      <div className="flex justify-between mb-4">
        <h3 className="font-bold text-gray-800">Shipping Plans</h3>
        <button className="text-xs bg-primary text-white px-3 py-1 rounded-lg">New Plan</button>
      </div>
      <Table columns={columns} data={amcPlans} />
    </Card>
  )
}
