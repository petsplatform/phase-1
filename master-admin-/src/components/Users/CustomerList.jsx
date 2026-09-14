import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Eye, Edit2, ShoppingBag, User, Trash2, Ban, CheckCircle } from 'lucide-react'
import Table from '../common/Table'
import ExportButtons from '../common/ExportButtons'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import DeleteModal from '../common/DeleteModal'
import CustomerForm from './CustomerForm'
import { useData } from '../../context/DataContext'
import { adminApi, getAdminToken, isSuperAdmin } from '../../lib/api'

export default function CustomerList() {
  const readOnly = isSuperAdmin()
  const { customers, orders } = useData()
  const [data, setData] = useState(customers)
  const [selected, setSelected] = useState(null)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isDeleting, setIsDeleting] = useState(null)
  const [exportRows, setExportRows] = useState([])

  // Block/Unblock state
  const [blockTarget, setBlockTarget] = useState(null) // { id, name } — open block modal
  const [blockReason, setBlockReason] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)
  const [unblockTarget, setUnblockTarget] = useState(null) // { id, name }
  const [unblockLoading, setUnblockLoading] = useState(false)

  const CUSTOMER_EXPORT_COLUMNS = [
    ...(readOnly ? [{ key: 'storeName', label: 'Store' }] : []),
    { key: 'displayId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'totalOrders', label: 'Orders' },
    { key: 'totalSpend', label: 'Total Spend' },
    { key: 'status', label: 'Status' },
  ]

  useEffect(() => { setData(customers) }, [customers])

  const handleAddSubmit = (newCustomer) => {
    const customerWithId = {
      ...newCustomer,
      id: `CUST${String(data.length + 1).padStart(3, '0')}`,
      products: 0,
      totalSpend: 0,
      joinedDate: new Date().toISOString().split('T')[0]
    }
    setData([customerWithId, ...data])
    setShowAdd(false)
  }

  const handleEditSubmit = async (updatedData) => {
    if (getAdminToken() && editingCustomer) {
      try {
        const updated = await adminApi.updateCustomer(editingCustomer.id, updatedData);
        setData(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...updated, name: updated.name, email: updated.email, phone: updated.phone } : c));
      } catch { /* toast shown by api */ }
    } else {
      setData(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...updatedData } : c));
    }
    setEditingCustomer(null);
  }

  const confirmDelete = async () => {
    if (isDeleting) {
      if (getAdminToken()) {
        try { await adminApi.deleteCustomer(isDeleting) } catch { /* fallback */ }
      }
      setData(prev => prev.filter(c => c.id !== isDeleting))
      setIsDeleting(null)
    }
  }

  const confirmBlock = async () => {
    if (!blockTarget) return
    setBlockLoading(true)
    try {
      const updated = await adminApi.blockCustomer(blockTarget.id, blockReason.trim() || undefined)
      setData(prev => prev.map(c => c.id === blockTarget.id ? { ...c, status: String(updated.status || '').toLowerCase(), blockedReason: updated.blockedReason } : c))
      setBlockTarget(null)
      setBlockReason('')
    } catch { /* toast shown by api */ }
    finally { setBlockLoading(false) }
  }

  const confirmUnblock = async () => {
    if (!unblockTarget) return
    setUnblockLoading(true)
    try {
      const updated = await adminApi.unblockCustomer(unblockTarget.id)
      setData(prev => prev.map(c => c.id === unblockTarget.id ? { ...c, status: String(updated.status || '').toLowerCase(), blockedReason: null } : c))
      setUnblockTarget(null)
    } catch { /* toast shown by api */ }
    finally { setUnblockLoading(false) }
  }

  const customerData = useMemo(() => {
    if (!selected) return null
    return { orders: (orders || []).filter(o => o.customerId === selected.id) }
  }, [selected, orders])

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'number') return value.toLocaleString()
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'string') {
      const timestamp = Date.parse(value)
      return Number.isNaN(timestamp) || !/^\d{4}-\d{2}-\d{2}/.test(value)
        ? value
        : new Date(value).toLocaleDateString()
    }
    return '—'
  }

  const formatAddress = (address) => {
    if (!address) return null
    let obj = address
    if (typeof address === 'string') {
      try { obj = JSON.parse(address) } catch { return address }
    }
    return [obj.name, obj.phone, obj.address, obj.city, obj.state, obj.postalCode]
      .filter(Boolean).join(', ') || '—'
  }

  const getSavedAddresses = (customer) => {
    let raw = customer.savedAddresses ?? customer.addresses
    if (!raw) return '—'
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) } catch { return raw }
    }
    if (!Array.isArray(raw)) raw = [raw]
    const formatted = raw.map(formatAddress).filter(Boolean)
    return formatted.length ? formatted.join(' | ') : '—'
  }

  const overviewFields = selected ? [
    ['ID', selected.id],
    ['Phone', selected.phone],
    ['Status', selected.status],
    ['Blocked Reason', selected.blockedReason],
    ['Joined', selected.joinedDate || selected.joined],
    ['Total Orders', selected.totalOrders],
    ['Total Spend', `$${(selected.totalSpend || 0).toLocaleString()}`],
    ['Cart Items', selected.cartItems?.length ? `${selected.cartItems.length} item(s)` : '0 item(s)'],
    ['Wishlist Items', selected.wishlistItems?.length ? `${selected.wishlistItems.length} item(s)` : '0 item(s)'],
    ['Created At', selected.createdAt],
    ['Updated At', selected.updatedAt],
  ] : []

  const columns = [
    ...(readOnly ? [{ key: 'storeName', label: 'Store', render: v => <span className="font-semibold text-gray-700">{v || '-'}</span> }] : []),
    { key: 'displayId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'totalOrders', label: 'Orders', render: v => <span className="font-semibold">{v}</span> },
    { key: 'totalSpend', label: 'Total Spend', render: v => `$${(v || 0).toLocaleString()}` },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'customerActions', label: 'Action', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelected(row); setActiveTab('overview') }}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {/* {!readOnly && (
            <button
              onClick={() => setEditingCustomer(row)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
              title="Edit Customer"
            >
              <Edit2 size={16} />
            </button>
          )} */}
          {!readOnly && String(row.status || '').toLowerCase() !== 'inactive' && (
            <button
              onClick={() => setBlockTarget({ id: row.id, name: row.name })}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-orange-600 transition-colors"
              title="Block Customer"
            >
              <Ban size={16} />
            </button>
          )}
          {!readOnly && String(row.status || '').toLowerCase() === 'inactive' && (
            <button
              onClick={() => setUnblockTarget({ id: row.id, name: row.name })}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors"
              title="Unblock Customer"
            >
              <CheckCircle size={16} />
            </button>
          )}
          {!readOnly && (
            <button
              onClick={() => setIsDeleting(row.id)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
              title="Delete Customer"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'products', label: 'Purchased Products', icon: ShoppingBag },
  ]

  return (
    <div className="space-y-4">
      <Table
        title="Customer List"
        data={data}
        columns={columns}
        searchKey="name"
        onFilteredChange={setExportRows}
        actions={<ExportButtons data={exportRows} columns={CUSTOMER_EXPORT_COLUMNS} filenamePrefix="customers" />}
      />

      {/* View Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Customer Details" width="max-w-6xl">
        {selected && (
          <div className="flex flex-col">
            <div className="flex border-b border-gray-100 mb-4 select-none overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
                    activeTab === tab.id ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="px-1">
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                    {selected.avatar ? (
                      <img src={selected.avatar} alt="Avatar" className="w-32 h-32 rounded-full object-cover shadow-md border-4 border-white shrink-0" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-white shadow-md flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-5xl">{selected.name?.[0]}</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center sm:items-start text-center sm:text-left mt-2">
                      <h2 className="text-2xl font-bold text-gray-900">{selected.name}</h2>
                      <p className="text-gray-500 text-sm mb-3">{selected.email}</p>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {overviewFields.map(([label, value]) => (
                      <div key={label} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100/50">
                        <p className="text-xs text-gray-400 capitalize mb-1 font-bold tracking-wider">{label}</p>
                        <p className="break-words text-sm font-semibold text-gray-700">{formatValue(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {customerData.orders.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {customerData.orders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-white">
                          <div className="space-y-1">
                            <p className="font-bold text-gray-800">{order.product}</p>
                            <p className="text-xs text-gray-500">Ordered on: {order.date} • ID: {order.id}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-bold text-primary">${order.amount?.toLocaleString()}</p>
                            <StatusBadge status={order.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 italic">No products purchased yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Block Modal */}
      <Modal isOpen={!!blockTarget} onClose={() => { setBlockTarget(null); setBlockReason('') }} title="Block Customer">
        {blockTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to block <span className="font-bold text-gray-900">{blockTarget.name}</span>. They will be logged out immediately and unable to login.
            </p>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-1 block">Block Reason <span className="text-gray-400 font-normal">(shown to customer)</span></span>
              <textarea
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                rows={3}
                placeholder="e.g. Suspicious activity detected on your account."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
              />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setBlockTarget(null); setBlockReason('') }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBlock}
                disabled={blockLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                {blockLoading ? 'Blocking...' : 'Block Customer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Unblock Confirm Modal */}
      <Modal isOpen={!!unblockTarget} onClose={() => setUnblockTarget(null)} title="Unblock Customer">
        {unblockTarget && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-4 shadow-inner">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Are you sure?</h3>
            <p className="text-sm text-gray-500 px-6">
              Are you sure you want to unblock <span className="font-bold text-gray-700">{unblockTarget.name}</span>? They will be able to login again.
            </p>
            <div className="flex items-center gap-3 w-full mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setUnblockTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnblock}
                disabled={unblockLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-60"
              >
                {unblockLoading ? 'Unblocking...' : 'Yes, Unblock'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Customer">
        <CustomerForm onSubmit={handleAddSubmit} />
      </Modal>

      <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Edit Customer">
        {editingCustomer && <CustomerForm initialData={editingCustomer} onSubmit={handleEditSubmit} />}
      </Modal>

      <DeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
      />
    </div>
  )
}
