import { useState } from 'react'
import { Edit2, Trash2, UserPlus } from 'lucide-react'
import DeleteModal from '../common/DeleteModal'
import Card from '../common/Card'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import StaffForm from './StaffForm'

export default function StaffTable({ staff: initialStaff }) {
  const [staffData, setStaffData] = useState(initialStaff)
  const [isDeleting, setIsDeleting] = useState(null)
  const [showAddStaff, setShowAddStaff] = useState(false)

  const handleDelete = () => {
    setStaffData(prev => prev.filter(s => s.id !== isDeleting))
    setIsDeleting(null)
  }

  const handleAddStaff = (member) => {
    const nextNumber = staffData.length + 1
    const today = new Date().toISOString().split('T')[0]
    const newStaff = {
      ...member,
      id: `STAFF${String(nextNumber).padStart(3, '0')}`,
      lastLogin: today,
    }

    setStaffData(prev => [newStaff, ...prev])
    setShowAddStaff(false)
  }

  const staffColumns = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: 'name', label: 'Name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'department', label: 'Department' },
    { key: 'lastLogin', label: 'Last Login' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'staffActions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors" title="Edit Staff">
            <Edit2 size={14} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete Staff">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <div className="flex justify-between items-center mb-4 gap-3">
        <p className="text-sm text-gray-500">{staffData.length} staff members</p>
        <button
          onClick={() => setShowAddStaff(true)}
          className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          <UserPlus size={13} /> Add Staff
        </button>
      </div>
      <Table columns={staffColumns} data={staffData} />

      <Modal isOpen={showAddStaff} onClose={() => setShowAddStaff(false)} title="Add Staff Member">
        <StaffForm onSubmit={handleAddStaff} />
      </Modal>

      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Staff Member"
        message="Are you sure you want to delete this staff member? This will revoke their access to the dashboard."
      />
    </Card>
  )
}
