import { useState } from 'react'

export default function ServiceForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    customer: '',
    type: 'Standard Fulfillment',
    issue: '',
    city: '',
    priority: 'Medium',
    status: 'Pending'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Customer Name</label>
          <input required value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="e.g. Rahul Verma" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Fulfillment Type</label>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }}>
            <option>Standard Fulfillment</option>
            <option>Express Fulfillment</option>
            <option>Return Pickup</option>
            <option>Refund Review</option>
            <option>Gift Wrap</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Priority</label>
          <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Task Notes</label>
          <textarea required rows={3} value={formData.issue} onChange={e => setFormData({...formData, issue: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="Describe the fulfillment task..." />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">City</label>
          <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="e.g. Delhi" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }}>
            <option>Pending</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button type="submit" className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md" style={{ background: 'var(--primary)' }}>
          {initialData ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}
