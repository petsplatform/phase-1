import { useState } from 'react'

export default function CustomerForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Customer Name</label>
          <input
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
            placeholder="e.g. Alex Morgan"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
          <input
            required
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
            placeholder="example@email.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border-color)' }}
            placeholder="+1 555 210 9088"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          type="submit"
          className="px-6 py-2 text-sm font-semibold text-white rounded-xl active:scale-95 transition-all shadow-md"
          style={{ background: 'var(--primary)' }}
        >
          {initialData ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  )
}
