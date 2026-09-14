import { useState } from 'react'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import { Eye } from 'lucide-react'
import { amcSubscriptions } from '../../data/dummyData'

export default function SubscriptionTable() {
  const [selected, setSelected] = useState(null)

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'plan', label: 'Plan', render: v => <span className="font-semibold">{v}</span> },
    { key: 'product', label: 'Product' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'servicesUsed', label: 'Used' },
    { key: 'servicesLeft', label: 'Remaining' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'id', label: '', render: (_, row) => (
        <button onClick={() => setSelected(row)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors" style={{ color: 'var(--primary)' }}>
          <Eye size={13} /> View
        </button>
      )
    }
  ]

  return (
    <>
      <Table 
        title="Shipments" 
        data={amcSubscriptions} 
        columns={columns} 
        searchKey="customer" 
      />

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Shipment Details">
        {selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(selected).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-400 capitalize mb-1">{k.replace(/([A-Z])/g, ' $1')}</p>
                {k === 'status' ? <StatusBadge status={v} /> :
                  <p className="text-sm font-medium text-gray-800">{v?.toString() || '—'}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
