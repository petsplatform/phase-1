import { useState } from 'react'
import { CalendarCheck, Clock } from 'lucide-react'
import SectionCard from './SectionCard'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'

export default function UpcomingDemos({ demos }) {
  const [selected, setSelected] = useState(null)

  return (
    <>
      <SectionCard title="Upcoming Content Drops" icon={CalendarCheck} iconColor="#7c3aed" badge={demos.length}>
        <div className="p-4 space-y-3">
          {demos.map(demo => (
            <div
              key={demo.id}
              onClick={() => setSelected(demo)}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-all cursor-pointer group active:scale-[0.98]"
              style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">{demo.customer}</p>
                <p className="text-xs text-gray-500">{demo.product} - {demo.address}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{demo.email}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={demo.status} size="xs" />
                {demo.scheduledDate && (
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                    <Clock size={9} /> {demo.scheduledDate}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Content Drop Details">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(selected).map(([k, v]) => (
                <div key={k} className={k === 'notes' ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-400 capitalize mb-1">{k.replace(/([A-Z])/g, ' $1')}</p>
                  {k === 'status' ? <StatusBadge status={v} /> :
                    <p className="text-sm font-medium text-gray-800">{v || '-'}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
