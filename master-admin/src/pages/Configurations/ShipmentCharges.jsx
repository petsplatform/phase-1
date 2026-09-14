import { useEffect, useRef, useState } from 'react'
import { Plus, Edit2, Trash2, Truck } from 'lucide-react'
import Table from '../../components/common/Table'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import DeleteModal from '../../components/common/DeleteModal'
import { shipmentChargeApi } from '../../api/shipmentChargeApi'
import { isSuperAdmin } from '../../lib/api'

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`

function ChargeForm({ initialData, onSubmit, onClose }) {
  const [form, setForm] = useState({
    label: initialData?.label || '',
    minOrderAmount: initialData?.minOrderAmount ?? 0,
    maxOrderAmount: initialData?.maxOrderAmount ?? '',
    charge: initialData?.charge ?? 0,
    status: initialData?.status || 'Active',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSubmit({
        ...form,
        minOrderAmount: Number(form.minOrderAmount),
        maxOrderAmount: form.maxOrderAmount === '' || form.maxOrderAmount === null ? null : Number(form.maxOrderAmount),
        charge: Number(form.charge),
      })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Label</label>
        <input className={inputCls} value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="e.g. Free Shipping, Standard Shipping" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Min Order Amount ($)</label>
          <input type="number" min="0" step="0.01" className={inputCls} value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Max Order Amount ($) <span className="text-gray-400 font-normal">(leave blank = no limit)</span></label>
          <input type="number" min="0" step="0.01" className={inputCls} value={form.maxOrderAmount} onChange={(e) => set('maxOrderAmount', e.target.value)} placeholder="No limit" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Shipping Charge ($)</label>
          <input type="number" min="0" step="0.01" className={inputCls} value={form.charge} onChange={(e) => set('charge', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all" style={{ borderColor: 'var(--border-color)' }}>Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60" style={{ background: 'var(--primary)' }}>
          {saving ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default function ShipmentCharges() {
  const readOnly = isSuperAdmin()
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [isDeleting, setIsDeleting] = useState(null)
  const reqRef = useRef(0)

  const load = async () => {
    const id = ++reqRef.current
    setLoading(true)
    try {
      const res = await shipmentChargeApi.list()
      if (id === reqRef.current) setCharges(res?.data?.data || [])
    } finally {
      if (id === reqRef.current) setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (data) => {
    await shipmentChargeApi.create(data)
    await load()
    setShowAdd(false)
  }

  const handleEdit = async (data) => {
    await shipmentChargeApi.update(editing.id, data)
    await load()
    setEditing(null)
  }

  const handleDelete = async () => {
    await shipmentChargeApi.remove(isDeleting)
    await load()
    setIsDeleting(null)
  }

  const columns = [
    { key: 'label', label: 'Label', render: (v) => <span className="font-semibold text-gray-800">{v || '—'}</span> },
    { key: 'minOrderAmount', label: 'Min Order', render: (v) => fmt(v) },
    { key: 'maxOrderAmount', label: 'Max Order', render: (v) => v != null ? fmt(v) : <span className="text-gray-400">No limit</span> },
    { key: 'charge', label: 'Charge', render: (v) => <span className="font-bold text-gray-900">{Number(v) === 0 ? <span className="text-green-600">Free</span> : fmt(v)}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    !readOnly && {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors" title="Edit"><Edit2 size={16} /></button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
        </div>
      )
    }
  ].filter(Boolean)

  return (
    <>
      <div className="mb-4 p-4 rounded-xl border bg-blue-50 border-blue-100 text-sm text-blue-700 flex items-start gap-2">
        <Truck size={16} className="shrink-0 mt-0.5" />
        <span>Shipping charges are automatically applied at checkout based on the order subtotal. Rules are matched from lowest to highest min order amount.</span>
      </div>
      <Table
        title={loading ? 'Shipment Charges — Loading...' : 'Shipment Charges'}
        data={charges}
        columns={columns}
        searchKey="label"
        emptyMessage="No shipment charge rules found"
        actions={!readOnly && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-sm" style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Add Rule
          </button>
        )}
      />
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Shipment Charge Rule">
        <ChargeForm onSubmit={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Shipment Charge Rule">
        {editing && <ChargeForm initialData={editing} onSubmit={handleEdit} onClose={() => setEditing(null)} />}
      </Modal>
      <DeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Shipment Charge Rule"
      />
    </>
  )
}
