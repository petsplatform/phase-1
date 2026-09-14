import { useState } from 'react'

export default function AMCPlanForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    duration: '1 Year',
    price: '',
    services: 4,
    filters: 2,
    status: 'Active'
  })

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Plan Name</label>
          <input
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
            placeholder="e.g. Express Shipping Plan"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Duration</label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <option>6 Months</option>
            <option>1 Year</option>
            <option>2 Years</option>
            <option>3 Years</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Price (USD)</label>
          <input
            required
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Dispatch Windows</label>
          <input
            required
            type="number"
            name="services"
            value={formData.services}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
            placeholder="4"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Restock Checks</label>
          <input
            required
            type="number"
            name="filters"
            value={formData.filters}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
            placeholder="2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-semibold text-white rounded-xl active:scale-95 transition-all shadow-md"
          style={{ background: 'var(--primary)' }}
        >
          {initialData ? 'Update Plan' : 'Create Plan'}
        </button>
      </div>
    </form>
  )
}
