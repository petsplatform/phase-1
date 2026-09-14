import { useState } from 'react'
import { Wrench } from 'lucide-react'
import SectionCard from './SectionCard'
import MiniTable from './MiniTable'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'

export default function PendingServices({ requests }) {
  const [selected, setSelected] = useState(null)

  return (
    <>
      <SectionCard title="Pending Fulfillment Tasks" icon={Wrench} iconColor="#d97706" badge={requests.length}>
        <MiniTable
          rows={requests}
          cols={[
            { key: 'id', label: 'ID' },
            { key: 'customer', label: 'Customer' },
            { key: 'type', label: 'Type' },
            { key: 'priority', label: 'Priority', render: v => <StatusBadge status={v} /> },
            { key: 'city', label: 'City' },
            { key: 'pendingServiceActions', label: '', render: (_, row) => (
              <button onClick={() => setSelected(row)} className="text-primary hover:underline font-medium text-xs">View</button>
            )},
          ]}
          emptyMsg="No pending fulfillment tasks"
        />
      </SectionCard>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Fulfillment Task Details">
        {selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(selected).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-400 capitalize mb-1">{k.replace(/([A-Z])/g, ' $1')}</p>
                {['status', 'priority', 'type'].includes(k) ? <StatusBadge status={v} /> :
                  <p className="text-sm font-medium text-gray-800">{v || '-'}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
