import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { staff } from '../../data/dummyData'
import StaffForm from '../Users/StaffForm'

export default function AssignTechnicianForm({ onSubmit, initialAgent = '' }) {
  const [agent, setAgent] = useState(initialAgent)
  const [showAddForm, setShowAddForm] = useState(false)
  
  const technicians = staff.filter(s => s.role === 'Technician' || s.role === 'Staff' || s.role === 'technician')

  const handleAddNew = (newStaff) => {
    // In a real app, this would hit an API. Here we just add to the local list and select it.
    // For mock purposes, we'll just pass the name back to the onSubmit
    onSubmit(newStaff.name)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(agent)
  }

  if (showAddForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor: 'var(--border-color)' }}>
          <h4 className="text-sm font-bold text-gray-700">Add New Staff Member</h4>
          <button 
            onClick={() => setShowAddForm(false)}
            className="text-xs text-blue-600 hover:underline"
          >
            Back to List
          </button>
        </div>
        <StaffForm 
          onSubmit={handleAddNew} 
          initialData={{ role: 'Staff', department: 'Operations', status: 'Active' }} 
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Select Staff Member</label>
          <button 
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
          >
            <UserPlus size={10} /> Add New
          </button>
        </div>
        <select 
          required 
          value={agent} 
          onChange={e => setAgent(e.target.value)} 
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" 
          style={{ borderColor: 'var(--border-color)' }}
        >
          <option value="">-- Choose Agent --</option>
          {technicians.map(t => (
            <option key={t.id} value={t.name}>{t.name} ({t.department})</option>
          ))}
        </select>
      </div>
      
      <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs">
        Assigning a staff member will update the task status to <b>Assigned</b> automatically.
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button type="submit" className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md" style={{ background: 'var(--primary)' }}>
          Assign Staff
        </button>
      </div>
    </form>
  )
}
