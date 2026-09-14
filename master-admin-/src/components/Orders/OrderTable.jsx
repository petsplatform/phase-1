import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Eye, FileText, Printer, Download, X, Trash2, Edit2, ShieldAlert, ExternalLink, FileImage, FileCheck, Truck } from 'lucide-react'
import DeleteModal from '../common/DeleteModal'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import Table from '../common/Table'
import ExportButtons from '../common/ExportButtons'
import StatusSelect from '../common/StatusSelect'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import { useData } from '../../context/DataContext'
import { isSuperAdmin, getAdminStoreKey, getAdminUser } from '../../lib/api'
import { getStoreLogo, getStoreLogoKey } from '../../lib/storeLogo'
import { systemSettings } from '../../data/dummyData'
import {
  canChangeOrderStatus,
  getStatusSelectOptions,
  isFinalOrderStatus,
} from '../../utils/orderStatusTransitions'
import { shipmentApi } from '../../api/shipmentApi'
import { showToast } from '../../lib/toast'
import { formatAddress } from '../../utils/addressFormatting'
import { ADMIN_SEARCH_PLACEHOLDER } from '../../constants/search'

const formatUSD = (value, options = {}) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
  ...options,
}).format(Number(value || 0))

const defaultInvoiceSettings = {
  companyName: 'Best Vet Care',
  address: 'Premium care, healthy pets, happy hearts.',
  gstNumber: '-',
  email: 'support@bestvetcare.com',
  phone: '-',
}

const storeInvoiceBranding = {
  STORE_1: {
    companyName: 'Best Vet Care',
    address: 'Premium care, healthy pets, happy hearts.',
    email: 'support@bestvetcare.com',
  },
  STORE_2: {
    companyName: 'Paws And Care',
    address: 'Healthy tails, happy trails.',
    email: 'support@pawsandcare.com',
  },
  STORE_3: {
    companyName: 'Healthy Paws Store',
    address: 'Pure ingredients for healthy and happy pets.',
    email: 'support@healthypawsstore.com',
  },
  STORE_4: {
    companyName: 'Vet Supply Express',
    address: 'Express delivery of veterinary supplies.',
    email: 'support@vetsupplyexpress.com',
  },
  STORE_5: {
    companyName: 'Happy PetRx',
    address: "Because your pet's health is our top priority.",
    email: 'support@happypetrx.com',
  },
  STORE_6: {
    companyName: 'Pet Meds Direct',
    address: 'Direct access to prescription pet medications.',
    email: 'support@petmedsdirect.com',
  },
  STORE_7: {
    companyName: 'Budget Petshop',
    address: 'Quality pet supplies at budget-friendly prices.',
    email: 'support@budgetpetshop.com',
  },
}

function getInvoiceSettings(order) {
  const key = order?.storeKey || order?.store?.storeKey || getAdminStoreKey() || ''
  const storeBrand = storeInvoiceBranding[key] || {}
  return {
    ...defaultInvoiceSettings,
    ...(systemSettings?.general || {}),
    ...storeBrand,
    companyName: storeBrand.companyName || order?.storeName || defaultInvoiceSettings.companyName,
  }
}

function PrescriptionFile({ url, label }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url) || url.includes('image')
  const isPdf = /\.pdf$/i.test(url) || url.includes('pdf')
  return (
    <div className="border border-amber-200 rounded-lg bg-white p-3">
      {label && <p className="text-[11px] font-bold text-amber-800 mb-2 truncate">{label}</p>}
      {isImage ? (
        <img src={url} alt="Prescription" className="w-full max-h-48 object-contain rounded mb-2" onError={e => { e.target.style.display = 'none' }} />
      ) : (
        <div className="flex items-center gap-2 mb-2">
          {isPdf ? <FileCheck size={22} className="text-red-500 shrink-0" /> : <FileImage size={22} className="text-blue-500 shrink-0" />}
          <p className="text-xs font-semibold text-gray-700 truncate">{isPdf ? 'prescription.pdf' : 'Prescription file'}</p>
        </div>
      )}
      <div className="flex gap-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors">
          <ExternalLink size={11} /> View
        </a>
        <a href={url} download className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
          <Download size={11} /> Download
        </a>
      </div>
    </div>
  )
}

function PrescriptionViewer({ prescriptions, prescriptionUrl }) {
  // Support both new array format and legacy single-url format
  const items = prescriptions?.length
    ? prescriptions
    : prescriptionUrl
      ? [{ url: prescriptionUrl }]
      : []
  if (!items.length) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <ShieldAlert size={14} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-900">Prescription Document{items.length > 1 ? 's' : ''}</p>
          <p className="text-[10px] text-amber-600">Uploaded by customer at checkout</p>
        </div>
      </div>
      <div className={`grid gap-3 ${items.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {items.map((item, i) => (
          <PrescriptionFile key={item.productId || i} url={item.url} label={items.length > 1 ? (item.productName || `Item ${i + 1}`) : undefined} />
        ))}
      </div>
    </div>
  )
}

const DEFAULT_ORDER_FILTERS = {
  status: 'All',
  dateRange: 'All',
  startDate: '',
  endDate: '',
}

const ORDER_STATUS_OPTIONS = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const DATE_RANGE_OPTIONS = [
  { value: 'All', label: 'All Dates' },
  { value: 'Today', label: 'Today' },
  { value: 'Last7', label: 'Last 7 Days' },
  { value: 'Last30', label: 'Last 30 Days' },
  { value: 'Custom', label: 'Custom' },
]
const SHIPMENT_STATUS_ACTIONS = [
  ['Packed', 'Mark Packed'],
  ['ReadyToShip', 'Ready To Ship'],
  ['Shipped', 'Mark Shipped'],
  ['OutForDelivery', 'Out For Delivery'],
  ['Delivered', 'Mark Delivered'],
]
const SHIPMENT_STATUS_STEP = {
  Pending: 0,
  Packed: 1,
  ReadyToShip: 2,
  Shipped: 3,
  OutForDelivery: 4,
  Delivered: 5,
  Cancelled: 99,
  Returned: 99,
  FailedDelivery: 99,
}
const FINAL_SHIPMENT_STATUSES = new Set(['Delivered', 'Cancelled', 'Returned', 'FailedDelivery'])

const toDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const BASE_ORDER_EXPORT_COLUMNS = [
  { key: 'orderId', label: 'Order ID' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'userEmail', label: 'User Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'productName', label: 'Product Name' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'orderDate', label: 'Order Date' },
  { key: 'orderStatus', label: 'Order Status' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'paymentMethod', label: 'Payment Method' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'discount', label: 'Discount' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'tax', label: 'Tax' },
  { key: 'total', label: 'Total' },
  { key: 'courierName', label: 'Courier' },
  { key: 'trackingNumber', label: 'Tracking Number' },
  { key: 'awbNumber', label: 'AWB Number' },
  { key: 'shipmentStatus', label: 'Shipment Status' },
  { key: 'estimatedDeliveryDate', label: 'Estimated Delivery' },
  { key: 'deliveryAddress', label: 'Delivery Address' },
]

const STORE_ORDER_EXPORT_COLUMN = { key: 'storeName', label: 'Store' }
const SHIPMENT_INPUT_CLASS = 'mt-1 h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm normal-case text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600'

function toTitleLabel(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())
}

function formatExportDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return toDateInputValue(date)
}

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : []
}

function getItemName(item) {
  return item?.name || item?.productName || item?.product?.name || item?.title || ''
}

function getProductNames(order) {
  const names = getOrderItems(order).map(getItemName).filter(Boolean)
  if (names.length) return names.join('; ')
  if (typeof order?.product === 'string') return order.product
  return order?.product?.name || ''
}

function getTotalQuantity(order) {
  const items = getOrderItems(order)
  if (!items.length) return order?.quantity || ''
  return items.reduce((total, item) => total + (Number(item?.quantity) || 1), 0)
}

function buildOrderExportRow(order, includeStore) {
  const row = {
    orderId: order.displayId || order.originalId || order.id || '',
    customerName: order.customer || order.customerName || order.customer?.name || '',
    userEmail: order.email || order.customerEmail || order.customer?.email || '',
    phone: order.phone || order.customer?.phone || '',
    productName: getProductNames(order),
    quantity: getTotalQuantity(order),
    orderDate: formatExportDate(order.orderDate || order.createdAt || order.date),
    orderStatus: toTitleLabel(order.status || order.orderStatus),
    paymentStatus: toTitleLabel(order.payment || order.paymentStatus),
    paymentMethod: order.paymentMethod || '',
    subtotal: Number(order.subtotal ?? 0),
    discount: Number(order.discount ?? 0),
    shipping: Number(order.shipping ?? 0),
    tax: Number(order.tax ?? 0),
    total: Number(order.total ?? order.amount ?? 0),
    courierName: order.courierName || '',
    trackingNumber: order.trackingNumber || '',
    awbNumber: order.awbNumber || '',
    shipmentStatus: toTitleLabel(order.shipmentStatus || (order.trackingNumber ? 'Pending' : '')),
    estimatedDeliveryDate: formatExportDate(order.estimatedDeliveryDate),
    deliveryAddress: order.address || formatAddress(order.shippingAddress || ''),
  }

  return includeStore ? { storeName: order.storeName || order.store?.name || '', ...row } : row
}

function getLatestShipmentEntry(order) {
  const history = Array.isArray(order?.shipmentHistory)
    ? order.shipmentHistory
    : Array.isArray(order?.timeline)
      ? order.timeline
      : []

  const sortedHistory = history
    .filter(entry => entry && typeof entry === 'object')
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  return sortedHistory.find(entry => entry.location || entry.description) || sortedHistory[0] || {}
}

function getAvailableShipmentActions(status) {
  const currentStatus = status || 'Pending'
  if (FINAL_SHIPMENT_STATUSES.has(currentStatus)) return []
  const currentStep = SHIPMENT_STATUS_STEP[currentStatus] ?? 0
  return SHIPMENT_STATUS_ACTIONS.filter(([nextStatus]) => (
    (SHIPMENT_STATUS_STEP[nextStatus] ?? 0) > currentStep
  ))
}

function validateShipmentForm(form) {
  const requiredFields = [
    ['courierName', 'Courier'],
    ['trackingNumber', 'Tracking number'],
    ['awbNumber', 'AWB number'],
    ['estimatedDeliveryDate', 'Estimated delivery date'],
    ['location', 'Location'],
    ['notes', 'Shipment notes'],
  ]
  const missing = requiredFields
    .filter(([key]) => !String(form[key] || '').trim())
    .map(([, label]) => label)

  if (missing.length) {
    return `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required.`
  }

  const estimatedDate = new Date(`${form.estimatedDeliveryDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (Number.isNaN(estimatedDate.getTime()) || estimatedDate < today) {
    return 'Estimated delivery date must be today or a future date.'
  }

  return ''
}

function getPresetDateRange(range) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (range === 'Today') {
    const value = toDateInputValue(today)
    return { startDate: value, endDate: value }
  }

  if (range === 'Last7' || range === 'Last30') {
    const start = new Date(today)
    start.setDate(today.getDate() - (range === 'Last7' ? 6 : 29))
    return {
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(today),
    }
  }

  return {}
}

export default function OrderTable() {
  const { orders, customers, loading, error, reloadOrders, updateOrder, deleteOrder } = useData()
  const readOnly = isSuperAdmin()
  const [selected, setSelected] = useState(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)
  const [confirmShipmentCancel, setConfirmShipmentCancel] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState(DEFAULT_ORDER_FILTERS)
  const [exportRows, setExportRows] = useState([])
  const [couriers, setCouriers] = useState([])
  const [shipmentForm, setShipmentForm] = useState({
    courierName: '',
    trackingNumber: '',
    awbNumber: '',
    estimatedDeliveryDate: '',
    notes: '',
    location: '',
  })
  const [savingShipment, setSavingShipment] = useState(false)
  const [printingLabelId, setPrintingLabelId] = useState('')
  const invoiceRef = useRef()

  const orderExportColumns = useMemo(
    () => readOnly ? [STORE_ORDER_EXPORT_COLUMN, ...BASE_ORDER_EXPORT_COLUMNS] : BASE_ORDER_EXPORT_COLUMNS,
    [readOnly],
  )
  const orderExportRows = useMemo(
    () => exportRows.map(order => buildOrderExportRow(order, readOnly)),
    [exportRows, readOnly],
  )

  const orderQueryParams = useMemo(() => {
    const dateRange = filters.dateRange === 'Custom'
      ? {
          startDate: filters.startDate,
          endDate: filters.endDate,
        }
      : getPresetDateRange(filters.dateRange)

    return {
      q: searchTerm,
      status: filters.status,
      ...dateRange,
    }
  }, [filters, searchTerm])

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    filters.status !== 'All' ||
    filters.dateRange !== 'All' ||
    filters.startDate ||
    filters.endDate,
  )

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'dateRange' && value !== 'Custom' ? { startDate: '', endDate: '' } : {}),
    }))
  }

  const resetOrderFilters = () => {
    setSearchTerm('')
    setFilters(DEFAULT_ORDER_FILTERS)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reloadOrders?.({ params: orderQueryParams })
    }, searchTerm.trim() ? 350 : 0)

    return () => window.clearTimeout(timer)
  }, [orderQueryParams, reloadOrders, searchTerm])

  useEffect(() => {
    const refreshOrders = () => {
      if (document.visibilityState === 'visible') {
        reloadOrders?.({ silent: true, params: orderQueryParams })
      }
    }

    window.addEventListener('focus', refreshOrders)
    document.addEventListener('visibilitychange', refreshOrders)

    return () => {
      window.removeEventListener('focus', refreshOrders)
      document.removeEventListener('visibilitychange', refreshOrders)
    }
  }, [orderQueryParams, reloadOrders])

  useEffect(() => {
    shipmentApi.listCouriers().then(setCouriers).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selected) return
    const latestShipmentEntry = getLatestShipmentEntry(selected)
    setShipmentForm({
      courierName: selected.courierName || '',
      trackingNumber: selected.trackingNumber || '',
      awbNumber: selected.awbNumber || '',
      estimatedDeliveryDate: selected.estimatedDeliveryDate ? toDateInputValue(new Date(selected.estimatedDeliveryDate)) : '',
      notes: selected.shipmentNotes || selected.latestShipmentNotes || latestShipmentEntry.description || '',
      location: selected.shipmentLocation || selected.latestShipmentLocation || latestShipmentEntry.location || '',
    })
  }, [selected?.id])

  useEffect(() => {
    if (!selected || readOnly) return

    let cancelled = false
    const shipmentOrderId = selected.originalId || selected.id
    shipmentApi
      .getShipment(shipmentOrderId)
      .then((shipment) => {
        if (cancelled || !shipment) return
        const latestShipmentEntry = getLatestShipmentEntry({
          shipmentHistory: shipment.timeline,
        })
        setSelected(prev => prev?.id === selected.id ? ({
          ...prev,
          ...shipment,
          shipmentHistory: shipment.timeline || prev.shipmentHistory || [],
          shipmentLocation: shipment.shipmentLocation || latestShipmentEntry.location || '',
          shipmentNotes: shipment.shipmentNotes || latestShipmentEntry.description || '',
          latestShipmentLocation: shipment.shipmentLocation || latestShipmentEntry.location || '',
          latestShipmentNotes: shipment.shipmentNotes || latestShipmentEntry.description || '',
        }) : prev)
        setShipmentForm(prev => ({
          ...prev,
          courierName: shipment.courierName || prev.courierName,
          trackingNumber: shipment.trackingNumber || prev.trackingNumber,
          awbNumber: shipment.awbNumber || prev.awbNumber,
          estimatedDeliveryDate: shipment.estimatedDeliveryDate ? toDateInputValue(new Date(shipment.estimatedDeliveryDate)) : prev.estimatedDeliveryDate,
          location: shipment.shipmentLocation || latestShipmentEntry.location || prev.location,
          notes: shipment.shipmentNotes || latestShipmentEntry.description || prev.notes,
        }))
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [selected?.id, selected?.originalId, readOnly])

  const handleDelete = () => {
    deleteOrder(isDeleting)
    setIsDeleting(null)
    if (selected?.id === isDeleting) setSelected(null)
  }

  const handleStatusUpdate = async (id, status) => {
    const order = orders.find(o => o.id === id)
    if (!canChangeOrderStatus(order?.status, status)) return

    await updateOrder(id, { status })
    if (selected?.id === id) {
      setSelected(prev => ({ ...prev, status }))
    }
  }

  const handleShipmentField = (event) => {
    const { name, value } = event.target
    setShipmentForm(prev => ({ ...prev, [name]: value }))
  }

  const applyShipmentToSelected = (shipment) => {
    const latestShipmentEntry = getLatestShipmentEntry({
      shipmentHistory: shipment?.timeline,
    })
    setSelected(prev => prev ? ({
      ...prev,
      ...shipment,
      shipmentHistory: shipment.timeline || prev.shipmentHistory || [],
      shipmentLocation: shipment.shipmentLocation || latestShipmentEntry.location || shipmentForm.location || prev.shipmentLocation || '',
      shipmentNotes: shipment.shipmentNotes || latestShipmentEntry.description || shipmentForm.notes || prev.shipmentNotes || '',
      latestShipmentLocation: shipment.shipmentLocation || latestShipmentEntry.location || shipmentForm.location || prev.latestShipmentLocation || '',
      latestShipmentNotes: shipment.shipmentNotes || latestShipmentEntry.description || shipmentForm.notes || prev.latestShipmentNotes || '',
    }) : prev)
  }

  const saveShipment = async () => {
    if (!selected) return
    const validationMessage = validateShipmentForm(shipmentForm)
    if (validationMessage) {
      showToast({ type: 'error', title: 'Error', message: validationMessage })
      return
    }
    setSavingShipment(true)
    try {
      const shipment = await shipmentApi.saveShipment(selected.id, shipmentForm, Boolean(selected.shipmentCreatedAt || selected.trackingNumber))
      applyShipmentToSelected(shipment)
      await reloadOrders?.({ silent: true, params: orderQueryParams })
      showToast({ type: 'success', title: 'Shipment saved', message: 'Shipment details were updated.' })
    } finally {
      setSavingShipment(false)
    }
  }

  const updateShipmentStatus = async (status) => {
    if (!selected) return
    const validationMessage = validateShipmentForm(shipmentForm)
    if (validationMessage) {
      showToast({ type: 'error', title: 'Error', message: validationMessage })
      return
    }
    setSavingShipment(true)
    try {
      const shipment = await shipmentApi.updateStatus(selected.id, {
        status,
        location: shipmentForm.location,
        description: shipmentForm.notes,
      })
      applyShipmentToSelected(shipment)
      await reloadOrders?.({ silent: true, params: orderQueryParams })
      showToast({ type: 'success', title: 'Shipment updated', message: `Shipment marked ${status.replace(/([A-Z])/g, ' $1').trim()}.` })
    } finally {
      setSavingShipment(false)
    }
  }

  const cancelShipment = async () => {
    if (!selected) return
    setConfirmShipmentCancel(false)
    setSavingShipment(true)
    try {
      const orderId = selected.originalId || selected.id
      const shipment = await shipmentApi.cancelShipment(orderId)
      applyShipmentToSelected(shipment)
      await reloadOrders?.({ silent: true, params: orderQueryParams })
      showToast({ type: 'success', title: 'Shipment cancelled', message: 'Shipment has been cancelled.' })
    } catch (err) {
      showToast({ type: 'error', title: 'Error', message: err?.response?.data?.message || err?.message || 'Failed to cancel shipment.' })
    } finally {
      setSavingShipment(false)
    }
  }

  const getOrderApiId = (order) => (
    readOnly ? order?.id : (order?.originalId || order?.id)
  )

  const printShipmentLabel = async (order) => {
    if (!order) return
    const orderId = getOrderApiId(order)
    const printWindow = window.open('', '_blank')
    setPrintingLabelId(orderId)
    try {
      const html = await shipmentApi.getShipmentLabelHtml(orderId)
      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
      }
    } catch (err) {
      printWindow?.close()
      showToast({
        type: 'error',
        title: 'Label not ready',
        message: err?.response?.data?.message || err?.message || 'Create shipment details before printing a label.',
      })
    } finally {
      setPrintingLabelId('')
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${selected?.displayId || selected?.id}`,
  })

  const handleDownloadPdf = useCallback(async () => {
    if (!invoiceRef.current || isPdfGenerating) return
    setIsPdfGenerating(true)
    try {
      const PROPS = ['color', 'background-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color']
      // Snapshot live computed rgb() values BEFORE cloning (browser resolves oklch -> rgb here)
      const liveEls = Array.from(invoiceRef.current.querySelectorAll('*'))
      const snapshot = liveEls.map(el => {
        const cs = window.getComputedStyle(el)
        return PROPS.reduce((acc, p) => { acc[p] = cs.getPropertyValue(p); return acc }, {})
      })

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (_doc, clonedEl) => {
          const clonedEls = Array.from(clonedEl.querySelectorAll('*'))
          clonedEls.forEach((el, i) => {
            const snap = snapshot[i]
            if (!snap) return
            PROPS.forEach(p => { if (snap[p]) el.style.setProperty(p, snap[p], 'important') })
          })
        },
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width
      let y = 0, remaining = imgH
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
        remaining -= pageH
        y += pageH
        if (remaining > 0) pdf.addPage()
      }
      pdf.save(`Invoice-${selected?.displayId || selected?.id}.pdf`)
    } finally {
      setIsPdfGenerating(false)
    }
  }, [invoiceRef, isPdfGenerating, selected])

  // Helper to get full customer details based on order's customerId
  const getCustomerDetails = (customerId) => {
    return customers.find(c => c.id === customerId) || {}
  }

  const columns = [
    ...(readOnly ? [{ key: 'storeName', label: 'Store', render: v => <span className="font-semibold text-gray-700">{v || '-'}</span> }] : []),
    { key: 'displayId', label: 'Order ID', render: v => <span className="font-mono text-xs font-semibold text-blue-700">{v || '—'}</span> },
    { key: 'customer', label: 'Customer', render: v => v || '—' },
    {
      key: 'product', label: 'Product', render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <span>{v || '—'}</span>
          {(row.prescriptions?.length || row.prescriptionUrl) && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
              <ShieldAlert size={9} /> Rx
            </span>
          )}
        </div>
      )
    },
    { key: 'amount', label: 'Amount', render: v => v != null ? <span className="font-semibold">{formatUSD(v)}</span> : '—' },
    { key: 'date', label: 'Date' },
    { key: 'payment', label: 'Payment', render: v => <StatusBadge status={v} /> },
    {
      key: 'status',
      label: 'Status',
      render: (v, row) => (
        readOnly ? <StatusBadge status={v} /> : (
          <StatusSelect
            status={v}
            options={getStatusSelectOptions(v)}
            disabled={isFinalOrderStatus(v)}
            onChange={(newStatus) => handleStatusUpdate(row.id, newStatus)}
          />
        )
      )
    },
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelected(row)}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            style={{ color: 'var(--primary)' }}
            title="View Details"
          >
            <Eye size={14} />
          </button>
          {row.trackingNumber && (
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
              <Truck size={12} /> {String(row.shipmentStatus || 'Pending').replace(/([A-Z])/g, ' $1').trim()}
            </span>
          )}
          {(row.trackingNumber || row.awbNumber || row.shipmentCreatedAt) && (
            <button
              type="button"
              onClick={() => printShipmentLabel(row)}
              disabled={printingLabelId === getOrderApiId(row)}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-amber-50 text-amber-700 transition-colors disabled:opacity-50"
              title="Print Shipment Label"
            >
              <Printer size={14} />
            </button>
          )}
          {/* <button
            onClick={() => { setSelected(row); setShowInvoice(true); }}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-600"
            title="View Invoice"
          >
            <FileText size={14} />
          </button> */}
          {/* <button
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-amber-600"
            title="Edit Order"
          >
            <Edit2 size={14} />
          </button> */}
          {/* <button
            onClick={() => setIsDeleting(row.id)}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 text-red-600 transition-colors"
            title="Delete Order"
          >
            <Trash2 size={14} />
          </button> */}
        </div>
      )
    }
  ]

  const filterControls = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <select
        value={filters.status}
        onChange={event => updateFilter('status', event.target.value)}
        className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)] w-full sm:w-36"
        style={{ borderColor: 'var(--border-color)' }}
        aria-label="Filter by order status"
      >
        {ORDER_STATUS_OPTIONS.map(status => (
          <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>
        ))}
      </select>
      <select
        value={filters.dateRange}
        onChange={event => updateFilter('dateRange', event.target.value)}
        className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)] w-full sm:w-36"
        style={{ borderColor: 'var(--border-color)' }}
        aria-label="Filter by order date"
      >
        {DATE_RANGE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {filters.dateRange === 'Custom' && (
        <>
          <input
            type="date"
            value={filters.startDate}
            onChange={event => updateFilter('startDate', event.target.value)}
            className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)] w-full sm:w-36"
            style={{ borderColor: 'var(--border-color)' }}
            aria-label="Order start date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={event => updateFilter('endDate', event.target.value)}
            className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)] w-full sm:w-36"
            style={{ borderColor: 'var(--border-color)' }}
            aria-label="Order end date"
          />
        </>
      )}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetOrderFilters}
          className="px-3 py-1.5 text-xs font-semibold border rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition-colors"
          style={{ borderColor: 'var(--border-color)' }}
        >
          Clear
        </button>
      )}
    </div>
  )

  const InvoiceTemplate = ({ order, customer }) => {
    if (!order) return null;

    const invoiceSettings = getInvoiceSettings(order)
    const adminUser = getAdminUser() || {}
    const storeKey = order?.storeKey || order?.store?.storeKey || getAdminStoreKey()
    const logoSrc = getStoreLogo({ ...adminUser, store: { storeKey } })

    const items = Array.isArray(order.items) && order.items.length
      ? order.items
      : [{ name: order.product, quantity: 1, price: Number(order.subtotal ?? order.amount ?? 0) }];
    const subtotal = order.subtotal != null
      ? Number(order.subtotal)
      : items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
    const discountAmount = Number(order.discount || 0);
    const shippingAmount = Number(order.shipping || 0);
    const taxAmount = Number(order.tax || 0);
    const orderAmount = order.total != null ? Number(order.total) : Number(order.amount || 0);

    return (
      <div ref={invoiceRef} className="bg-white p-8 max-w-3xl mx-auto h-full text-sm">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
          <div>
            {logoSrc && (
              <img src={logoSrc} alt={invoiceSettings.companyName} className="h-12 w-auto object-contain mb-3" crossOrigin="anonymous" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-2">Invoice</h1>
            <p className="font-medium text-gray-900">{invoiceSettings.companyName}</p>
            <p className="text-gray-500 max-w-xs">{invoiceSettings.address}</p>
            {/* <p className="text-gray-500">GSTIN: {invoiceSettings.gstNumber}</p> */}
            <p className="text-gray-500">{invoiceSettings.email}</p>
          </div>
          <div className="text-right">
            <div className="inline-block bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-left">
               <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Invoice Info</p>
               <p className="text-gray-900 font-bold mb-0.5">#{order.id}</p>
               <p className="text-gray-500 text-xs">Date: {order.date}</p>
               <div className="mt-2">
                  <StatusBadge status={order.payment === 'COD' && order.status !== 'delivered' ? 'pending' : 'paid'} />
               </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</h2>
          <div className="text-gray-800">
            <p className="font-bold text-lg">{order.customer}</p>
            <p>{order.address || '-'}</p>
            {customer && (
              <div className="mt-2 text-gray-500 text-xs space-y-0.5">
                <p>Phone: {customer.phone}</p>
                <p>Email: {customer.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-0">
          <table className="w-full mb-8">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left font-bold text-gray-600 uppercase text-xs tracking-wider">Product</th>
                <th className="py-3 px-4 text-center font-bold text-gray-600 uppercase text-xs tracking-wider w-24">Qty</th>
                <th className="py-3 px-4 text-right font-bold text-gray-600 uppercase text-xs tracking-wider w-32">Price</th>
                <th className="py-3 px-4 text-right font-bold text-gray-600 uppercase text-xs tracking-wider w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={item.productId || item.id || index}>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-gray-900">{item.name || order.product}</p>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">{item.quantity || 1}</td>
                  <td className="py-4 px-4 text-right text-gray-600">{formatUSD(item.price)}</td>
                  <td className="py-4 px-4 text-right font-medium text-gray-900">{formatUSD(Number(item.price || 0) * Number(item.quantity || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatUSD(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatUSD(discountAmount)}</span>
              </div>
            )}
            {shippingAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatUSD(shippingAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatUSD(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
              <span className="font-bold text-lg text-gray-900">Grand Total</span>
              <span className="font-bold text-lg text-primary">{formatUSD(orderAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-8 text-center text-gray-400 text-xs leading-relaxed">
          <p className="font-medium text-gray-600 mb-1">Thank you for your business!</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>For any queries, please contact {invoiceSettings.email} or call {invoiceSettings.phone}.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Table
        title="Recent Orders"
        data={orders}
        columns={columns}
        searchKey="customer"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={ADMIN_SEARCH_PLACEHOLDER}
        serverSearch
        filterControls={filterControls}
        onFilteredChange={setExportRows}
        actions={
          <div className="flex items-center gap-2">
            <ExportButtons data={orderExportRows} columns={orderExportColumns} filenamePrefix="orders" disabled={loading} />
            {loading && <span className="text-xs font-semibold text-gray-400">Loading...</span>}
            {error && <span className="text-xs font-semibold text-red-500">{error}</span>}
          </div>
        }
      />

      {/* View Details Modal */}
      <Modal isOpen={!!selected && !showInvoice} onClose={() => setSelected(null)} title="Order Details" width="max-w-2xl">
        {selected && (
          <div className="space-y-6">
             <div className="flex items-start justify-between">
                <div>
                   <h3 className="text-xl font-bold text-gray-800">{selected.product}</h3>
                   <span className="text-sm text-gray-500">Ordered on {selected.date}</span>
                </div>
                <StatusBadge status={selected.status} />
             </div>

             {/* Prescription Documents */}
             {(selected.prescriptions?.length || selected.prescriptionUrl) && (
               <PrescriptionViewer prescriptions={selected.prescriptions} prescriptionUrl={selected.prescriptionUrl} />
             )}

             <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
               <div className="mb-4 flex items-center justify-between gap-3">
                 <div>
                   <p className="text-sm font-bold text-blue-950">Shipment Details</p>
                   <p className="text-xs font-semibold text-blue-700">
                     {readOnly ? 'View courier movement and shipment details.' : 'Create, update, and track courier movement.'}
                   </p>
                 </div>
                 <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
                   {(selected.shipmentStatus || 'Pending').replace(/([A-Z])/g, ' $1').trim()}
                 </span>
               </div>

               <div className="grid gap-3 sm:grid-cols-2">
                 <label className="text-xs font-bold uppercase text-gray-500">
                   Courier
                   <select name="courierName" value={shipmentForm.courierName} onChange={handleShipmentField} disabled={readOnly} className={SHIPMENT_INPUT_CLASS}>
                     <option value="">Select courier</option>
                     {couriers.filter(c => c.status === 'Active').map(courier => <option key={courier.id} value={courier.name}>{courier.name}</option>)}
                   </select>
                 </label>
                 <label className="text-xs font-bold uppercase text-gray-500">
                   Tracking Number
                   <input name="trackingNumber" value={shipmentForm.trackingNumber} onChange={handleShipmentField} readOnly={readOnly} disabled={readOnly} className={SHIPMENT_INPUT_CLASS} />
                 </label>
                 <label className="text-xs font-bold uppercase text-gray-500">
                   AWB Number
                   <input name="awbNumber" value={shipmentForm.awbNumber} onChange={handleShipmentField} readOnly={readOnly} disabled={readOnly} className={SHIPMENT_INPUT_CLASS} />
                 </label>
                 <label className="text-xs font-bold uppercase text-gray-500">
                   Estimated Delivery
                   <input type="date" name="estimatedDeliveryDate" value={shipmentForm.estimatedDeliveryDate} onChange={handleShipmentField} readOnly={readOnly} disabled={readOnly} className={SHIPMENT_INPUT_CLASS} />
                 </label>
                 <label className="text-xs font-bold uppercase text-gray-500">
                   Location
                   <input name="location" value={shipmentForm.location} onChange={handleShipmentField} readOnly={readOnly} disabled={readOnly} className={SHIPMENT_INPUT_CLASS} />
                 </label>
                 <label className="text-xs font-bold uppercase text-gray-500">
                   Shipment Notes
                   <input name="notes" value={shipmentForm.notes} onChange={handleShipmentField} readOnly={readOnly} disabled={readOnly} className={SHIPMENT_INPUT_CLASS} />
                 </label>
               </div>

               {!readOnly && (
                 <div className="mt-4 flex flex-wrap gap-2">
                   <button type="button" disabled={savingShipment} onClick={saveShipment} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                     {selected.trackingNumber ? 'Update Shipment' : 'Create Shipment'}
                   </button>
                   {getAvailableShipmentActions(selected.shipmentStatus).map(([status, label]) => (
                     <button key={status} type="button" disabled={savingShipment} onClick={() => updateShipmentStatus(status)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 disabled:opacity-60">
                       {label}
                     </button>
                   ))}
                   {!new Set(['Shipped', 'InTransit', 'OutForDelivery', 'Delivered', 'Cancelled', 'Returned', 'FailedDelivery']).has(selected.shipmentStatus || 'Pending') && (
                     <button type="button" disabled={savingShipment} onClick={() => setConfirmShipmentCancel(true)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-60">Cancel Shipment</button>
                   )}
                 </div>
               )}

               {(selected.trackingNumber || selected.awbNumber || selected.shipmentCreatedAt) && (
                 <div className="mt-4 flex justify-end">
                   <button
                     type="button"
                     onClick={() => printShipmentLabel(selected)}
                     disabled={printingLabelId === getOrderApiId(selected)}
                     className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                   >
                     <Printer size={14} /> {printingLabelId === getOrderApiId(selected) ? 'Preparing Label...' : 'Print Label'}
                   </button>
                 </div>
               )}

               {(selected.shipmentHistory?.length || selected.timeline?.length) && (
                 <div className="mt-4 space-y-2">
                   <p className="text-xs font-bold uppercase text-gray-500">Shipment Timeline</p>
                   {(selected.shipmentHistory || selected.timeline || []).map((entry, index) => (
                     <div key={entry.id || index} className="rounded-lg bg-white px-3 py-2 text-xs">
                       <p className="font-bold text-gray-900">{String(entry.status || 'Update').replace(/([A-Z])/g, ' $1').trim()} <span className="font-normal text-gray-400">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</span></p>
                       {(entry.location || entry.description || entry.createdBy) && <p className="mt-1 text-gray-500">{[entry.location, entry.description, entry.createdBy ? `By ${entry.createdBy}` : ''].filter(Boolean).join(' - ')}</p>}
                     </div>
                   ))}
                 </div>
               )}
             </div>

             <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-b border-gray-100 py-6">
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Customer</p>
                   <p className="font-semibold text-gray-900">{selected.customer}</p>
                   {(selected.email || selected.phone) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selected.email && <span>{selected.email}</span>}
                        {selected.email && selected.phone && <br/>}
                        {selected.phone && <span>{selected.phone}</span>}
                      </p>
                   )}
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
                   <p className="font-mono font-medium text-gray-700">{selected.id}</p>
                </div>
                <div className="col-span-2">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery Address</p>
                   <p className="break-words font-medium text-gray-700">{selected.address || '-'}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                   <p className="font-medium text-gray-700">{selected.paymentMethod}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Status</p>
                   <StatusBadge status={selected.payment} />
                </div>
             </div>

             <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-gray-800">Total Amount</span>
                <span className="text-2xl font-bold text-primary">{formatUSD(selected.amount)}</span>
             </div>
             
             <div className="flex justify-end pt-4">
                <button 
                  onClick={() => setShowInvoice(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                   <FileText size={16} /> View Invoice
                </button>
             </div>
          </div>
        )}
      </Modal>

      {/* Invoice Modal */}
      {showInvoice && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                 <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <FileText size={18} className="text-primary"/> Invoice View
                 </h2>
                 <div className="flex items-center gap-2">
                    <button
                       onClick={handlePrint}
                       disabled={isPdfGenerating}
                       className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-bold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <Printer size={14} /> Print
                    </button>
                    {/* <button
                       onClick={handleDownloadPdf}
                       disabled={isPdfGenerating}
                       className="flex items-center gap-2 px-3 py-1.5 text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                       style={{ background: 'var(--primary)' }}
                    >
                       <Download size={14} /> {isPdfGenerating ? 'Generating...' : 'Download PDF'}
                    </button> */}
                    <button 
                       onClick={() => setShowInvoice(false)}
                       className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                    >
                       <X size={18} />
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-6">
                 <div className="shadow-lg rounded-none">
                    <InvoiceTemplate order={selected} customer={getCustomerDetails(selected.customerId)} />
                 </div>
              </div>
           </div>
        </div>
      )}

      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
      />
      <DeleteModal
        isOpen={confirmShipmentCancel}
        onClose={() => setConfirmShipmentCancel(false)}
        onConfirm={cancelShipment}
        title="Cancel Shipment"
        message="Cancel this shipment? The shipment status will be marked as cancelled."
        confirmLabel="Yes, Cancel Shipment"
      />
    </>
  )
}
