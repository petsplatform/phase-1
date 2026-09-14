import { useState } from 'react'
import { Eye, Plus, Edit2, Trash2 } from 'lucide-react'
import DeleteModal from '../common/DeleteModal'
import Table from '../common/Table'
import StatusSelect from '../common/StatusSelect'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import { useData } from '../../context/DataContext'
import ServiceForm from './ServiceForm'
import AssignTechnicianForm from './AssignTechnicianForm'

export default function ServiceRequestTable({ data: initialData, title }) {
  const { services, addService, updateService, deleteService } = useData()
  const [selected, setSelected] = useState(null)
  const [editingRequest, setEditingRequest] = useState(null)
  const [assigningTo, setAssigningTo] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)

  // Use initialData if provided for filtered fulfillment pages, otherwise fallback to global services.
  const displayData = initialData || services

  const handleDelete = () => {
    deleteService(isDeleting)
    setIsDeleting(null)
  }

  const handleAddSubmit = (newReq) => {
    const reqWithId = {
      ...newReq,
      id: `SRV${String(services.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      agent: ''
    }
    addService(reqWithId)
    setShowAdd(false)
  }

  const handleAssignSubmit = (agentName) => {
    updateService(assigningTo.id, { agent: agentName, status: 'Assigned' })
    setAssigningTo(null)
  }

  const handleEditSubmit = (updatedData) => {
    updateService(editingRequest.id, updatedData)
    setEditingRequest(null)
  }

  const handleStatusChange = (id, newStatus) => {
    updateService(id, { status: newStatus })
  }

  const handleDeleteClick = (id) => {
    setIsDeleting(id)
  }

  const columns = [
    { key: 'id', label: 'ID', render: v => v || '—' },
    { key: 'customer', label: 'Customer', render: v => v || '—' },
    { key: 'type', label: 'Type', render: v => v ? <span className={`font-medium ${v === 'amc' ? 'text-blue-600' : 'text-emerald-600'}`}>{v === 'amc' ? 'Priority' : 'Paid'}</span> : '—' },
    { key: 'issue', label: 'Issue', render: v => v || '—' },
    { key: 'city', label: 'City', render: v => v || '—' },
    { key: 'date', label: 'Date', render: v => v || '—' },
    { key: 'priority', label: 'Priority', render: v => <StatusBadge status={v} /> },
    { key: 'agent', label: 'Agent', render: v => v || <span className="text-gray-400 text-xs italic">Unassigned</span> },
    { 
      key: 'status', 
      label: 'Status', 
      render: (v, row) => (
        <StatusSelect 
          status={v} 
          options={['pending', 'assigned', 'in_progress', 'resolved']} 
          onChange={(newStatus) => handleStatusChange(row.id, newStatus)} 
        />
      ) 
    },
    {
      key: 'serviceRequestActions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.agent && (
            <button 
              onClick={() => setAssigningTo(row)}
              className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Assign
            </button>
          )}
          <button onClick={() => setSelected(row)} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors" style={{ color: 'var(--primary)' }} title="View Details">
            <Eye size={13} /> View
          </button>
          <button 
            onClick={() => setEditingRequest(row)} 
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
            title="Edit Task"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => setIsDeleting(row.id)} 
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <Table 
        title={title} 
        data={displayData} 
        columns={columns} 
        searchKey="customer" 
        actions={
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Create Task
          </button>
        }
      />
      
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Fulfillment Task Details" width="max-w-2xl">
        {selected && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
               <div>
                  <h3 className="text-lg font-bold text-gray-800">{selected.issue}</h3>
                  <p className="text-xs text-gray-500 mt-1">Requested on {selected.createdAt}</p>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={selected.status} />
                  <StatusBadge status={selected.priority} />
               </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
               {/* Customer Details */}
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{selected.customer}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.customerId}</p>
                  <p className="text-sm text-gray-600 mt-1">{selected.city}</p>
               </div>

               {/* Agent Details */}
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned Staff</p>
                  {selected.agent ? (
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                           {selected.agent.charAt(0)}
                        </div>
                        <p className="font-medium text-gray-800">{selected.agent}</p>
                     </div>
                  ) : (
                     <span className="text-sm text-gray-400 italic">Not assigned yet</span>
                  )}
               </div>

               {/* Fulfillment Info */}
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fulfillment Type</p>
                  <p className="font-medium text-gray-800 capitalize">{selected.type === 'amc' ? 'Priority Order' : 'Paid Order'}</p>
               </div>

               {/* Schedule Info */}
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Scheduled Date</p>
                  <p className="font-medium text-gray-800">{selected.scheduledDate || 'Not scheduled'}</p>
               </div>
            </div>

            {/* Status Action Bar */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {['Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'].map(s => {
                  const isActive = selected.status.toLowerCase() === s.toLowerCase().replace(' ', '_');
                  // Helper to match status strings from dummy data which are lowercase/snake_case
                  const statusValue = s.toLowerCase().replace(' ', '_');
                  
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        // Global update
                        updateService(selected.id, { status: statusValue })
                        setSelected(prev => ({ ...prev, status: statusValue }))
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selected.status === statusValue || selected.status === s.toLowerCase()
                          ? 'bg-gray-900 text-white shadow-md transform scale-105' 
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Fulfillment Task">
        <ServiceForm onSubmit={handleAddSubmit} />
      </Modal>

      <Modal isOpen={!!editingRequest} onClose={() => setEditingRequest(null)} title="Edit Fulfillment Task">
        {editingRequest && (
          <ServiceForm initialData={editingRequest} onSubmit={handleEditSubmit} />
        )}
      </Modal>

      <Modal isOpen={!!assigningTo} onClose={() => setAssigningTo(null)} title="Assign Staff">
        {assigningTo && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border text-sm" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-gray-500 text-xs">Fulfillment Task</p>
              <p className="font-semibold">{assigningTo.customer} - {assigningTo.type}</p>
              <p className="text-xs text-gray-400 mt-1">{assigningTo.issue}</p>
            </div>
            <AssignTechnicianForm onSubmit={handleAssignSubmit} />
          </div>
        )}
      </Modal>

      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Fulfillment Task"
        message="Are you sure you want to delete this fulfillment task? This action cannot be undone."
      />
    </>
  )
}
