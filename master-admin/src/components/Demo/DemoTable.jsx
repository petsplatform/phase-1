import { useState } from 'react'
import { Eye, UserCheck, Plus, Edit2, Trash2 } from 'lucide-react'
import DeleteModal from '../common/DeleteModal'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import { demoBookings as initialDemos } from '../../data/dummyData'
import DemoForm from './DemoForm'
import AssignDemoForm from './AssignDemoForm'

export default function DemoTable() {
  const [data, setData] = useState(initialDemos)
  const [selected, setSelected] = useState(null)
  const [assigningTo, setAssigningTo] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)

  const handleDelete = () => {
    setData(prev => prev.filter(d => d.id !== isDeleting))
    setIsDeleting(null)
    if (selected?.id === isDeleting) setSelected(null)
  }

  const handleAddSubmit = (newDemo) => {
    const demoWithId = {
      ...newDemo,
      id: `CNT${String(data.length + 1).padStart(3, '0')}`,
      bookingDate: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      assignedTo: null
    }
    setData([demoWithId, ...data])
    setShowAdd(false)
  }

  const handleAssignSubmit = (agentName) => {
    setData(prev => prev.map(item => 
      item.id === assigningTo.id 
        ? { ...item, assignedTo: agentName } 
        : item
    ))
    setAssigningTo(null)
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'customer', label: 'Customer', render: v => v || '—' },
    { key: 'product', label: 'Campaign', render: v => v || '—' },
    { key: 'scheduledDate', label: 'Date', render: (v) => v || <span className="text-gray-400 italic">Unscheduled</span> },
    { key: 'scheduledTime', label: 'Time', render: v => v || '—' },
    { key: 'assignedTo', label: 'Owner', render: v => v ? (
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
          {v.charAt(0)}
        </div>
        <span className="text-sm text-gray-700">{v}</span>
      </div>
    ) : <span className="text-gray-400 text-xs italic">Unassigned</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.assignedTo && row.status !== 'cancelled' && (
            <button 
              onClick={() => setAssigningTo(row)}
              className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors flex items-center gap-1"
            >
              <UserCheck size={12} /> Assign
            </button>
          )}
          <button onClick={() => setSelected(row)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors" style={{ color: 'var(--primary)' }}>
            <Eye size={13} /> View
          </button>
          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors" title="Edit Content Drop">
            <Edit2 size={16} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete Content Drop">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <Table 
        title="Content Calendar" 
        data={data} 
        columns={columns} 
        searchKey="customer"
        actions={
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Add Content Drop
          </button>
        }
      />
      
      {/* Details Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Content Drop Details" width="max-w-2xl">
        {selected && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selected.product}</h3>
                <p className="text-xs text-gray-500 mt-1">Content ID: {selected.id}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {/* Customer Info */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Details</p>
                <p className="font-semibold text-gray-900">{selected.customer}</p>
                <p className="text-sm text-gray-600 mt-0.5">{selected.phone}</p>
                <p className="text-sm text-gray-600">{selected.email}</p>
                <p className="text-xs text-gray-400 mt-1">{selected.address}</p>
              </div>

               {/* Owner Info */}
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Campaign Owner</p>
                  {selected.assignedTo ? (
                     <div className="flex items-center gap-3 mt-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                           {selected.assignedTo.charAt(0)}
                        </div>
                        <p className="font-medium text-gray-800">{selected.assignedTo}</p>
                     </div>
                  ) : (
                     <div className="mt-1">
                        <p className="text-sm text-gray-400 italic mb-2">Not assigned yet</p>
                        <button 
                          onClick={() => { setSelected(null); setAssigningTo(selected); }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Assign Now
                        </button>
                     </div>
                  )}
               </div>

               {/* Schedule Info */}
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                  <p className="font-medium text-gray-800">{selected.scheduledDate}</p>
                  <p className="text-sm text-gray-600">{selected.scheduledTime}</p>
               </div>

               {/* Notes */}
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-sm text-gray-600 italic">{selected.notes || 'No additional notes'}</p>
               </div>
            </div>

            {/* Status Grid */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                        setData(prev => prev.map(item => item.id === selected.id ? { ...item, status: s.toLowerCase() } : item))
                        setSelected(prev => ({ ...prev, status: s.toLowerCase() }))
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selected.status === s.toLowerCase() 
                        ? 'bg-gray-900 text-white shadow-md transform scale-105' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Content Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Content Drop">
        <DemoForm onSubmit={handleAddSubmit} />
      </Modal>

      {/* Assign Owner Modal */}
      <Modal isOpen={!!assigningTo} onClose={() => setAssigningTo(null)} title="Assign Content Owner">
        {assigningTo && (
           <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                 <p className="text-gray-500 text-xs">Assigning owner for content drop with</p>
                 <p className="font-semibold text-gray-900">{assigningTo.customer}</p>
                 <p className="text-xs text-gray-500 mt-0.5">{assigningTo.product} • {assigningTo.scheduledDate}</p>
              </div>
              <AssignDemoForm onSubmit={handleAssignSubmit} />
           </div>
        )}
      </Modal>

      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Content Drop"
        message="Are you sure you want to delete this content drop? This action cannot be undone."
      />
    </>
  )
}
