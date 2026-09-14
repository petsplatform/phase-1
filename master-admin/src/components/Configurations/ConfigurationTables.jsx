import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Send, Edit2, Trash2, ImageIcon, LayoutGrid, List, Calendar, MapPin, Eye } from 'lucide-react'
import DeleteModal from '../common/DeleteModal'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import StatusSelect from '../common/StatusSelect'
import Modal from '../common/Modal'
import Pagination from '../common/Pagination'
import { useData } from '../../context/DataContext'
import { contentApi } from '../../api/contentApi'
import { CouponForm, TaxForm, BannerForm, NotificationForm } from './ConfigForms'
import { adminApi, getAdminToken, isSuperAdmin } from '../../lib/api'

const formatUSD = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

const formatPercent = (value) => `${Number(value || 0).toFixed(2).replace(/\.?0+$/, '')}%`

export function NotificationTable() {
  const { notifications, deleteNotification, addNotification } = useData()
  const [showAdd, setShowAdd] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)

  const handleAdd = (item) => {
    addNotification({ ...item, id: `NTF${notifications.length + 1}`, date: new Date().toISOString().split('T')[0], reach: '0' })
    setShowAdd(false)
  }

  const handleDelete = () => {
    deleteNotification(isDeleting)
    setIsDeleting(null)
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title', render: v => <span className="font-semibold text-gray-800">{v || '—'}</span> },
    { key: 'target', label: 'Target' },
    { key: 'reach', label: 'Reach' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'notificationActions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]
  return (
    <>
      <Table title="Notifications" data={notifications} columns={columns} searchKey="title"
        actions={<button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-sm" style={{ background: 'var(--primary)' }}><Send size={13} /> Create Notification</button>} />
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Notification">
        <NotificationForm onSubmit={handleAdd} />
      </Modal>
      <DeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Notification"
      />
    </>
  )
}

export function BannerTable() {
  const { banners, addBanner, updateBanner, deleteBanner } = useData()
  const readOnly = isSuperAdmin()
  const [showAdd, setShowAdd] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [isDeleting, setIsDeleting] = useState(null)
  const [view, setView] = useState('table')
  const [cardPage, setCardPage] = useState(1)
  const cardsPerPage = 10
  const cardTotalPages = Math.max(1, Math.ceil(banners.length / cardsPerPage))
  const paginatedBanners = useMemo(
    () => banners.slice((cardPage - 1) * cardsPerPage, cardPage * cardsPerPage),
    [banners, cardPage],
  )

  useEffect(() => {
    setCardPage(current => Math.min(current, cardTotalPages))
  }, [cardTotalPages])

  const handleAdd = async (item) => {
    if (readOnly) return
    if (getAdminToken()) {
      const created = await contentApi.createBanner(item)
      addBanner({ ...item, ...(created?.data ?? {}), id: created?.data?.id ?? `BNR${banners.length + 1}` })
      setShowAdd(false)
      return
    }
    addBanner({ ...item, id: `BNR${banners.length + 1}` })
    setShowAdd(false)
  }

  const handleEdit = async (updatedData) => {
    if (readOnly) return
    if (getAdminToken()) {
      const updated = await contentApi.updateBanner(editingBanner.id, updatedData)
      updateBanner(editingBanner.id, { ...updatedData, ...(updated?.data ?? {}) })
      setEditingBanner(null)
      return
    }
    updateBanner(editingBanner.id, updatedData)
    setEditingBanner(null)
  }

  const handleDelete = async () => {
    if (readOnly) return
    if (getAdminToken()) {
      await contentApi.deleteBanner(isDeleting)
    }
    deleteBanner(isDeleting)
    setIsDeleting(null)
  }

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: v => (
        <div className="w-20 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
          {v ? (
            <img src={v} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={16} className="text-gray-300" />
          )}
        </div>
      )
    },
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title', render: v => <span className="font-semibold text-gray-800">{v || '—'}</span> },
    { key: 'position', label: 'Position' },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    !readOnly && {
      key: 'bannerActions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditingBanner(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ].filter(Boolean)

  const ViewToggle = (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
      <button onClick={() => setView('card')} title="Card View"
        className={`p-1.5 rounded-md transition-colors ${view === 'card' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        style={view === 'card' ? { color: 'var(--primary)' } : {}}>
        <LayoutGrid size={15} />
      </button>
      <button onClick={() => setView('table')} title="Table View"
        className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        style={view === 'table' ? { color: 'var(--primary)' } : {}}>
        <List size={15} />
      </button>
    </div>
  )

  return (
    <>
      {view === 'table' ? (
        <Table title="Banners" data={banners} columns={columns} searchKey="title"
          actions={
            <div className="flex items-center gap-2">
              {ViewToggle}
              {!readOnly && (
                <button onClick={() => { if (!readOnly) setShowAdd(true) }} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-sm" style={{ background: 'var(--primary)' }}>
                  <Plus size={13} /> Add Banner
                </button>
              )}
            </div>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between gap-4" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="font-display font-semibold text-gray-800 text-sm">Banners</h3>
            <div className="flex items-center gap-2">
              {ViewToggle}
              {!readOnly && (
                <button onClick={() => { if (!readOnly) setShowAdd(true) }} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-sm" style={{ background: 'var(--primary)' }}>
                  <Plus size={13} /> Add Banner
                </button>
              )}
            </div>
          </div>
          {banners.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No banners found</div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedBanners.map(banner => (
                <div key={banner.id} className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="w-full h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {banner.image ? (
                      <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-300" />
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-800 text-sm leading-tight">{banner.title || '—'}</span>
                      <StatusBadge status={banner.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin size={11} className="shrink-0" />
                      <span>{banner.position || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={11} className="shrink-0" />
                      <span>{banner.startDate || '—'} → {banner.endDate || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-400 font-mono">{banner.id}</span>
                      {!readOnly && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { if (!readOnly) setEditingBanner(banner) }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-amber-600 transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => { if (!readOnly) setIsDeleting(banner.id) }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            currentPage={cardPage}
            totalPages={cardTotalPages}
            onPageChange={setCardPage}
            totalItems={banners.length}
            itemsPerPage={cardsPerPage}
          />
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Banner">
        <BannerForm onSubmit={handleAdd} />
      </Modal>
      <Modal isOpen={!!editingBanner} onClose={() => setEditingBanner(null)} title="Edit Banner">
        {editingBanner && <BannerForm initialData={editingBanner} onSubmit={handleEdit} />}
      </Modal>
      <DeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Banner"
      />
    </>
  )
}

const INQUIRY_STATUS_OPTIONS = ['New', 'In Progress', 'Resolved']

export function InquiryTable() {
  const { inquiries, deleteInquiry, updateInquiryStatus } = useData()
  const [isDeleting, setIsDeleting] = useState(null)
  const [viewingInquiry, setViewingInquiry] = useState(null)

  const handleDelete = () => {
    deleteInquiry(isDeleting)
    setIsDeleting(null)
  }

  const handleStatusChange = (status) => {
    updateInquiryStatus(viewingInquiry.id, status)
    setViewingInquiry(prev => prev ? { ...prev, status } : prev)
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'subject', label: 'Subject', render: v => <span className="font-medium text-gray-800">{v || '—'}</span> },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'inquiryActions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewingInquiry(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors" title="View">
            <Eye size={16} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <Table title="Inquiries" data={inquiries} columns={columns} searchKey="name" />
      <Modal isOpen={!!viewingInquiry} onClose={() => setViewingInquiry(null)} title="Inquiry Details">
        {viewingInquiry && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
                <p className="text-sm font-semibold text-gray-800">{viewingInquiry.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                <p className="text-sm font-semibold text-gray-800">{viewingInquiry.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                <p className="text-sm font-semibold text-gray-800">{viewingInquiry.phone || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Subject</p>
                <p className="text-sm font-semibold text-gray-800">{viewingInquiry.subject}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Message</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">{viewingInquiry.message}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                <StatusSelect status={viewingInquiry.status} options={INQUIRY_STATUS_OPTIONS} onChange={handleStatusChange} />
              </div>
              <button
                onClick={() => { setIsDeleting(viewingInquiry.id); setViewingInquiry(null) }}
                className="px-4 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
              >
                Delete Inquiry
              </button>
            </div>
          </div>
        )}
      </Modal>
      <DeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Inquiry"
      />
    </>
  )
}

export default function CouponTable() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useData()
  const readOnly = isSuperAdmin()
  const [showAdd, setShowAdd] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [isDeleting, setIsDeleting] = useState(null)

  const handleAdd = async (item) => {
    if (readOnly) return
    await addCoupon(item)
    setShowAdd(false)
  }

  const handleEdit = async (updatedData) => {
    if (readOnly) return
    await updateCoupon(editingCoupon.id, updatedData)
    setEditingCoupon(null)
  }

  const handleDelete = async () => {
    if (readOnly) return
    await deleteCoupon(isDeleting)
    setIsDeleting(null)
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'code', label: 'Code', render: v => v ? <code className="font-bold text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">{v}</code> : '—' },
    { key: 'type', label: 'Type' },
    { key: 'value', label: 'Value', render: (v, row) => row.type === 'percentage' ? `${v || 0}%` : formatUSD(v) },
    { key: 'minOrder', label: 'Min Order', render: v => formatUSD(v) },
    { key: 'usageCount', label: 'Used' },
    { key: 'maxUses', label: 'Max' },
    { key: 'expiry', label: 'Expiry', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    !readOnly && {
      key: 'couponActions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditingCoupon(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ].filter(Boolean)
  return (
    <>
      <Table
        title="Coupons"
        data={coupons}
        columns={columns}
        searchKey="code"
        actions={!readOnly &&
          <button onClick={() => { if (!readOnly) setShowAdd(true) }} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-sm" style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Create Coupon
          </button>
        }
      />
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Coupon">
        <CouponForm onSubmit={handleAdd} />
      </Modal>
      <Modal isOpen={!!editingCoupon} onClose={() => setEditingCoupon(null)} title="Edit Coupon">
        {editingCoupon && <CouponForm initialData={editingCoupon} onSubmit={handleEdit} />}
      </Modal>
      <DeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Coupon"
      />
    </>
  )
}

export function TaxTable() {
  const readOnly = isSuperAdmin()
  const [taxes, setTaxes] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingTax, setEditingTax] = useState(null)
  const [isDeleting, setIsDeleting] = useState(null)
  const taxRequestRef = useRef(0)

  const loadTaxes = async () => {
    const requestId = ++taxRequestRef.current
    setLoading(true)
    try {
      const records = await adminApi.taxes()
      if (requestId === taxRequestRef.current) setTaxes(records)
    } finally {
      if (requestId === taxRequestRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    const handleAuthChange = () => {
      taxRequestRef.current += 1
      setTaxes([])
      if (getAdminToken()) loadTaxes()
      else setLoading(false)
    }

    loadTaxes()
    window.addEventListener('admin-auth-change', handleAuthChange)

    return () => {
      taxRequestRef.current += 1
      window.removeEventListener('admin-auth-change', handleAuthChange)
    }
  }, [])

  const handleAdd = async (item) => {
    if (readOnly) return
    await adminApi.createTax(item)
    await loadTaxes()
    setShowAdd(false)
  }

  const handleEdit = async (updatedData) => {
    if (readOnly) return
    await adminApi.updateTax(editingTax.id, updatedData)
    await loadTaxes()
    setEditingTax(null)
  }

  const handleDelete = async () => {
    if (readOnly) return
    await adminApi.deleteTax(isDeleting)
    await loadTaxes()
    setIsDeleting(null)
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', render: v => <span className="font-semibold text-gray-800">{v || '—'}</span> },
    { key: 'rate', label: 'Rate', render: v => <span className="font-bold text-gray-900">{formatPercent(v)}</span> },
    { key: 'description', label: 'Description', render: v => <span className="max-w-xs truncate block">{v || '—'}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    !readOnly && {
      key: 'taxActions', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditingTax(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors" title="Edit">
            <Edit2 size={16} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ].filter(Boolean)

  return (
    <>
      <Table
        title={loading ? 'Tax Rates - Loading...' : 'Tax Rates'}
        data={taxes}
        columns={columns}
        searchKey="name"
        emptyMessage="No tax rates found"
        actions={!readOnly &&
          <button onClick={() => { if (!readOnly) setShowAdd(true) }} className="flex items-center gap-2 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-all shadow-sm" style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Create Tax
          </button>
        }
      />
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Create Tax">
        <TaxForm onSubmit={handleAdd} />
      </Modal>
      <Modal isOpen={!!editingTax} onClose={() => setEditingTax(null)} title="Edit Tax">
        {editingTax && <TaxForm initialData={editingTax} onSubmit={handleEdit} />}
      </Modal>
      <DeleteModal
        isOpen={!!isDeleting}
        onClose={() => setIsDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Tax"
      />
    </>
  )
}
