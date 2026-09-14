import { useState } from 'react'

export default function DemoForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    phone: '',
    interest: 'Homepage Banner',
    address: '',
    scheduledDate: '',
    agent: '',
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
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="e.g. Meena Singh" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
          <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="+1 555 210 9088" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Content Type</label>
          <select value={formData.interest} onChange={e => setFormData({...formData, interest: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }}>
            <option>Homepage Banner</option>
            <option>Blog Feature</option>
            <option>Seasonal Campaign</option>
            <option>Product Launch</option>
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Placement Notes</label>
          <textarea required rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="Homepage, category page, email campaign..." />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Publish Date</label>
          <input type="datetime-local" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }}>
            <option>Pending</option>
            <option>Scheduled</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button type="submit" className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md" style={{ background: 'var(--primary)' }}>
          {initialData ? 'Update Content Drop' : 'Add Content Drop'}
        </button>
      </div>
    </form>
  )
}
