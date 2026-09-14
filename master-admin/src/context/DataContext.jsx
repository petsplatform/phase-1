import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  orders as initialOrders,
  customers as initialCustomers,
  serviceRequests as initialServices,
  amcRenewals as initialRenewals,
  supportTickets as initialTickets,
  demoBookings as initialDemos,
  coupons as initialCoupons,
  banners as initialBanners,
  notifications as initialNotifications
} from '../data/dummyData'
import { adminApi, getAdminToken, isSuperAdmin } from '../lib/api'
import { filterBySelectedStore, SUPER_ADMIN_STORE_EVENT } from '../lib/superAdminStore'
import { formatAddress } from '../utils/addressFormatting'

const DataContext = createContext()

const formatLocalDateOnly = (value) => {
  if (!value) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayDateKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const isDateBeforeToday = (value) => {
  if (!value) return false
  const dateKey = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : formatLocalDateOnly(value)
  return Boolean(dateKey && dateKey < getTodayDateKey())
}

const normalizeRecordStatus = (status) => String(status || 'active').toLowerCase()

const normalizeCoupon = (coupon) => ({
  ...coupon,
  status: isDateBeforeToday(coupon.expiry) ? 'expired' : normalizeRecordStatus(coupon.status),
})

export function DataProvider({ children }) {
  const [orders, setOrders] = useState(initialOrders)
  const [services, setServices] = useState(initialServices)
  const [renewals, setRenewals] = useState(initialRenewals)
  const [tickets, setTickets] = useState(initialTickets)
  const [demos, setDemos] = useState(initialDemos)
  const [coupons, setCoupons] = useState(initialCoupons)
  const [banners, setBanners] = useState(initialBanners)
  const [inquiries, setInquiries] = useState([])
  const [notifications, setNotifications] = useState(initialNotifications)
  const [customers, setCustomers] = useState(initialCustomers)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pendingCouponCreatesRef = useRef(new Set())
  const ordersRequestRef = useRef(0)
  const backendRequestRef = useRef(0)

  const normalizeStatus = normalizeRecordStatus

  const normalizeOrder = (order) => {
    let customerStr = 'Customer';
    if (order.customerName) customerStr = order.customerName;
    else if (typeof order.customer === 'string') customerStr = order.customer;
    else if (order.customer && order.customer.name) customerStr = order.customer.name;

    let productStr = `${Array.isArray(order.items) ? order.items.length : 0} item(s)`;
    if (order.items && Array.isArray(order.items) && order.items[0]) {
       productStr = order.items[0].name || order.items[0].product?.name || order.items[0].productName || productStr;
    } else if (order.product) {
       productStr = typeof order.product === 'string' ? order.product : (order.product.name || productStr);
    }

    return {
      ...order,
      storeName: order.storeName || order.store?.name || '',
      displayId: order.originalId || order.id,
      customer: customerStr,
      customerId: order.customerId && (order.storeKey || order.store?.storeKey)
        ? `${order.storeKey || order.store?.storeKey}:${order.customerId}`
        : order.customerId,
      product: productStr,
      amount: order.total || order.amount || 0,
      createdAt: order.createdAt,
      orderDate: order.orderDate,
      date: order.orderDate ? formatLocalDateOnly(order.orderDate) : order.date,
      payment: normalizeStatus(order.paymentStatus || order.payment || 'paid'),
      paymentMethod: order.paymentMethod || order.payment || 'Card',
      status: normalizeStatus(order.orderStatus || order.status),
      address: formatAddress(order.shippingAddress || order.address),
    };
  };

  const sortOrdersNewestFirst = (items = []) => (
    [...items]
      .filter((order, index, source) => (
        order?.id && source.findIndex(item => item?.id === order.id) === index
      ))
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.orderDate || a.date || 0).getTime()
        const bTime = new Date(b.createdAt || b.orderDate || b.date || 0).getTime()
        if (bTime !== aTime) return bTime - aTime
        return String(b.id || '').localeCompare(String(a.id || ''))
      })
  )

  const normalizeCustomer = (customer) => ({
    ...customer,
    storeName: customer.storeName || customer.store?.name || '',
    displayId: customer.originalId || customer.id,
    city: customer.city || customer.addresses?.[0]?.city || '-',
    state: customer.state || customer.addresses?.[0]?.state || '',
    totalSpend: customer.totalSpent || customer.totalSpend || 0,
    totalOrders: customer.totalOrders || 0,
    joinedDate: customer.joined ? new Date(customer.joined).toISOString().split('T')[0] : customer.joinedDate,
    status: normalizeStatus(customer.status),
    amcActive: Boolean(customer.amcActive || customer.activeAMC || customer.totalOrders > 3),
  })

  const normalizeContent = (item) => ({
    ...item,
    status: isDateBeforeToday(item.endDate) ? 'expired' : normalizeStatus(item.status),
    date: item.publishedDate ? new Date(item.publishedDate).toISOString().split('T')[0] : item.date,
    startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : item.startDate,
    endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : item.endDate,
  })

  const INQUIRY_STATUS_LABELS = { New: 'New', InProgress: 'In Progress', Resolved: 'Resolved' }
  const INQUIRY_STATUS_TO_ENUM = { New: 'New', 'In Progress': 'InProgress', Resolved: 'Resolved' }

  const normalizeInquiry = (inquiry) => ({
    ...inquiry,
    name: inquiry.fullName || inquiry.name,
    date: inquiry.createdAt ? new Date(inquiry.createdAt).toISOString().split('T')[0] : inquiry.date,
    status: INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status || 'New',
  })

  const filterForSuperAdminStore = (items = []) => (
    isSuperAdmin() ? filterBySelectedStore(items) : items
  )

  const resetBackendData = () => {
    backendRequestRef.current += 1
    ordersRequestRef.current += 1
    pendingCouponCreatesRef.current.clear()
    setOrders([])
    setCustomers([])
    setBanners([])
    setCoupons([])
    setInquiries([])
    setError('')
  }

  const loadBackendData = async () => {
    if (!getAdminToken()) {
      resetBackendData()
      setLoading(false)
      return
    }
    const requestId = ++backendRequestRef.current
    const ordersRequestId = ++ordersRequestRef.current
    setLoading(true)
    setError('')
    try {
      const [ordersData, customersData, bannersData, couponsData, inquiriesData] = await Promise.all([
        adminApi.orders(),
        adminApi.customers(),
        adminApi.banners(),
        adminApi.coupons(),
        adminApi.inquiries(),
      ])
      if (requestId !== backendRequestRef.current) return
      if (ordersRequestId === ordersRequestRef.current) {
        setOrders(sortOrdersNewestFirst(filterForSuperAdminStore(ordersData).map(normalizeOrder)))
      }
      setCustomers(filterForSuperAdminStore(customersData).map(normalizeCustomer))
      setBanners(filterForSuperAdminStore(bannersData).map(normalizeContent))
      setCoupons(couponsData.map(normalizeCoupon))
      setInquiries(filterForSuperAdminStore(inquiriesData).map(normalizeInquiry))
    } catch (err) {
      if (requestId === backendRequestRef.current) {
        setError(err.message || 'Unable to load backend data')
      }
    } finally {
      if (requestId === backendRequestRef.current) setLoading(false)
    }
  }

  const reloadOrders = useCallback(async ({ silent = false, params } = {}) => {
    if (!getAdminToken()) return []
    const requestId = ++ordersRequestRef.current
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      const ordersData = await adminApi.orders(params)
      if (requestId !== ordersRequestRef.current) return []
      const nextOrders = sortOrdersNewestFirst(filterForSuperAdminStore(ordersData).map(normalizeOrder))
      setOrders(nextOrders)
      return nextOrders
    } catch (err) {
      if (requestId === ordersRequestRef.current && !silent) {
        setError(err.message || 'Unable to load orders')
      }
      return []
    } finally {
      if (requestId === ordersRequestRef.current && !silent) setLoading(false)
    }
  }, [])

  const reloadCoupons = useCallback(async () => {
    if (!getAdminToken()) {
      setCoupons([])
      return []
    }
    const records = await adminApi.coupons()
    setCoupons(records.map(normalizeCoupon))
    return records
  }, [])

  useEffect(() => {
    const handleAuthChange = () => {
      resetBackendData()
      if (getAdminToken()) {
        loadBackendData()
      } else {
        setLoading(false)
      }
    }

    loadBackendData()
    window.addEventListener('admin-auth-change', handleAuthChange)
    window.addEventListener(SUPER_ADMIN_STORE_EVENT, handleAuthChange)

    return () => {
      backendRequestRef.current += 1
      ordersRequestRef.current += 1
      window.removeEventListener('admin-auth-change', handleAuthChange)
      window.removeEventListener(SUPER_ADMIN_STORE_EVENT, handleAuthChange)
    }
  }, [])

  // Orders
  const updateOrder = async (id, updates) => {
    if (isSuperAdmin()) return
    if (getAdminToken() && updates.status) {
      const orderStatus = String(updates.status).replace(/(^|_)(\w)/g, (_, __, char) => char.toUpperCase())
      const updated = await adminApi.updateOrderStatus(id, orderStatus)
      setOrders(prev => sortOrdersNewestFirst(prev.map(o => o.id === id ? normalizeOrder(updated) : o)))
      return
    }
    setOrders(prev => sortOrdersNewestFirst(prev.map(o => o.id === id ? { ...o, ...updates } : o)))
  }
  const deleteOrder = async (id) => {
    if (isSuperAdmin()) return
    if (getAdminToken()) {
      try { await adminApi.deleteOrder(id) } catch { /* fallback */ }
    }
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  // Services
  const addService = (item) => setServices(prev => [item, ...prev])
  const updateService = (id, updates) => setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  const deleteService = (id) => setServices(prev => prev.filter(s => s.id !== id))

  // Tickets
  const updateTicket = (id, updates) => setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  const deleteTicket = (id) => setTickets(prev => prev.filter(t => t.id !== id))

  // Demos
  const updateDemo = (id, updates) => setDemos(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  const deleteDemo = (id) => setDemos(prev => prev.filter(d => d.id !== id))

  // Coupons
  const addCoupon = async (item) => {
    if (isSuperAdmin()) return null
    const normalizedCode = String(item.code || '').trim().toUpperCase()

    if (pendingCouponCreatesRef.current.has(normalizedCode)) {
      return null
    }

    if (coupons.some(coupon => String(coupon.code || '').toUpperCase() === normalizedCode)) {
      throw new Error('Coupon code already exists.')
    }

    pendingCouponCreatesRef.current.add(normalizedCode)
    try {
      if (getAdminToken()) {
        const created = await adminApi.createCoupon({ ...item, code: normalizedCode })
        await reloadCoupons()
        return created
      }

      const localCoupon = normalizeCoupon({ ...item, code: normalizedCode, id: `CPN${Date.now()}` })
      setCoupons(prev => [localCoupon, ...prev])
      return localCoupon
    } finally {
      pendingCouponCreatesRef.current.delete(normalizedCode)
    }
  }

  const updateCoupon = async (id, updates) => {
    if (isSuperAdmin()) return null
    const normalizedCode = String(updates.code || '').trim().toUpperCase()
    if (
      normalizedCode &&
      coupons.some(coupon => coupon.id !== id && String(coupon.code || '').toUpperCase() === normalizedCode)
    ) {
      throw new Error('Coupon code already exists.')
    }

    try {
      const payload = normalizedCode ? { ...updates, code: normalizedCode } : updates
      if (getAdminToken()) {
        const updated = await adminApi.updateCoupon(id, payload)
        await reloadCoupons()
        return updated
      }

      setCoupons(prev => prev.map(c => c.id === id ? normalizeCoupon({ ...c, ...payload }) : c))
      return { id, ...payload }
    } catch (error) {
      if (getAdminToken()) throw error
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
      return { id, ...updates }
    }
  }
  const deleteCoupon = async (id) => {
    if (isSuperAdmin()) return
    try { await adminApi.deleteCoupon(id) } catch { /* fallback */ }
    if (getAdminToken()) {
      await reloadCoupons()
      return
    }
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  // Banners
  const addBanner = (item) => {
    if (isSuperAdmin()) return
    setBanners(prev => [normalizeContent(item), ...prev])
  }
  const updateBanner = (id, updates) => {
    if (isSuperAdmin()) return
    setBanners(prev => prev.map(b => b.id === id ? normalizeContent({ ...b, ...updates }) : b))
  }
  const deleteBanner = (id) => {
    if (isSuperAdmin()) return
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  // Inquiries
  const deleteInquiry = async (id) => {
    if (getAdminToken()) {
      try { await adminApi.deleteInquiry(id) } catch { /* fallback */ }
    }
    setInquiries(prev => prev.filter(i => i.id !== id))
  }

  const updateInquiryStatus = async (id, status) => {
    const enumStatus = INQUIRY_STATUS_TO_ENUM[status] || status
    if (getAdminToken()) {
      try {
        const updated = await adminApi.updateInquiryStatus(id, enumStatus)
        setInquiries(prev => prev.map(i => i.id === id ? normalizeInquiry(updated) : i))
        return
      } catch { /* fallback */ }
    }
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  // Notifications
  const addNotification = (item) => setNotifications(prev => [item, ...prev])
  const deleteNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id))

  const value = {
    loading, error, reloadBackendData: loadBackendData, reloadOrders,
    orders, updateOrder, deleteOrder,
    customers,
    services, addService, updateService, deleteService,
    renewals,
    tickets, updateTicket, deleteTicket,
    demos, updateDemo, deleteDemo,
    coupons, addCoupon, updateCoupon, deleteCoupon,
    banners, addBanner, updateBanner, deleteBanner,
    inquiries, deleteInquiry, updateInquiryStatus,
    notifications, addNotification, deleteNotification
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
