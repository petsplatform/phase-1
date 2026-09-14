import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Star, CheckCircle, ShoppingBag, Loader2 } from 'lucide-react'
import AddReviewModal from './AddReviewModal'
import { useNotification } from '../../utils/NotificationContext'
import { reviewApi } from '../../api/reviewApi'

export default function OrderHistoryTab({
  orders = [],
  selectedOrder,
  setSelectedOrder,
  triggerTracking,
  onCancelOrder,
  isLoading = false,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const { showNotification } = useNotification()
  const ordersPerPage = 3

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewModalItem, setReviewModalItem] = useState(null)
  const [reviewModalOrderItems, setReviewModalOrderItems] = useState([])
  const [reviewModalOrderId, setReviewModalOrderId] = useState(null)
  const [reviewedItems, setReviewedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('budget_petshop_reviewed_items')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const totalOrders = orders.length
  const totalPages = Math.ceil(totalOrders / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endItem = Math.min(startIndex + ordersPerPage, totalOrders)
  const paginatedOrders = orders.slice(startIndex, endItem)

  const openReviewModal = (item, orderItems = [], orderId = null) => {
    setReviewModalItem(item)
    setReviewModalOrderItems(orderItems)
    setReviewModalOrderId(orderId)
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmit = async (reviewData) => {
    const key = reviewData.itemId
    const updated = { ...reviewedItems, [key]: reviewData }
    setReviewedItems(updated)
    try {
      localStorage.setItem('budget_petshop_reviewed_items', JSON.stringify(updated))
    } catch (e) {
      console.error("Failed to save review to localStorage:", e)
    }
    if (reviewModalOrderId && reviewData.itemId) {
      try {
        await reviewApi.submitReview({
          productId: String(reviewData.itemId),
          orderId: String(reviewModalOrderId),
          rating: reviewData.rating,
          comment: reviewData.reviewText,
        })
      } catch (e) {
        console.error("Failed to submit review to API:", e)
      }
    }
    showNotification(
      `Review submitted for "${reviewData.productName}"! Thank you for your feedback.`,
      "success"
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-on-background border-b border-outline pb-4 mb-6">Order History</h2>

      {isLoading ? (
        /* FIRST-TIME LOADING SKELETON LOADER */
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-secondary font-bold mb-2">
            <Loader2 className="animate-spin text-secondary" size={18} />
            <span>Loading your order history...</span>
          </div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-outline rounded-2xl p-5 bg-white animate-pulse flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2 flex-1 w-full">
                <div className="h-4 bg-surface-soft rounded-lg w-1/3"></div>
                <div className="h-3 bg-surface-soft rounded-lg w-2/3 mt-2"></div>
                <div className="h-5 bg-surface-soft rounded-lg w-1/4 mt-3"></div>
              </div>
              <div className="h-9 bg-surface-soft rounded-full w-28 shrink-0"></div>
            </div>
          ))}
        </div>
      ) : selectedOrder ? (
        /* ORDER DETAIL VIEW */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedOrder(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:underline cursor-pointer mb-2"
          >
            &larr; Back to all orders
          </button>
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline pb-4">
            <div>
              <h3 className="text-lg font-bold text-on-background">Order Details: {selectedOrder.id}</h3>
              <p className="text-xs text-charcoal-text mt-1">Placed on {selectedOrder.date}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                selectedOrder.status?.toLowerCase() === 'delivered'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : selectedOrder.status?.toLowerCase() === 'cancelled'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                {selectedOrder.status}
              </span>

              {selectedOrder.status?.toLowerCase() === 'delivered' && (
                <button
                  type="button"
                  onClick={() => openReviewModal(null, selectedOrder.items, selectedOrder.id)}
                  className="rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-900 px-4 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Star size={13} className="fill-amber-400 text-amber-500 shrink-0" />
                  <span>Add Review</span>
                </button>
              )}

              {selectedOrder.status?.toLowerCase() !== 'cancelled' && (
                <button
                  onClick={() => triggerTracking(selectedOrder)}
                  className="rounded-full bg-secondary hover:bg-secondary/90 px-4 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                >
                  Track Package
                </button>
              )}
            </div>
          </div>

          {/* Items Grid */}
          <div className="divide-y divide-outline border border-outline rounded-2xl overflow-hidden bg-white">
            {selectedOrder.items.map((item) => {
              const itemIdKey = item.id || item.productId
              const isReviewed = Boolean(reviewedItems[itemIdKey])
              const isDelivered = selectedOrder.status?.toLowerCase() === 'delivered'

              return (
                <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover border border-outline shrink-0 bg-surface-soft" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-background truncate">{item.name}</h4>
                      <p className="text-xs text-charcoal-text mt-0.5">Quantity: {item.quantity}</p>
                      {isDelivered && (
                        <div className="mt-1.5">
                          {isReviewed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <CheckCircle size={12} className="text-emerald-600" />
                              Reviewed ({reviewedItems[itemIdKey]?.rating}★)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openReviewModal(item, [item], selectedOrder.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 px-3 py-1 rounded-full transition cursor-pointer"
                            >
                              <Star size={12} className="fill-amber-400 text-amber-500" />
                              Add Review
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right self-end sm:self-center">
                    <p className="font-extrabold text-on-background">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                    <p className="text-xs text-charcoal-text mt-0.5">${(item.price || 0).toFixed(2)} each</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Details Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-outline rounded-2xl p-4 bg-surface-tint/10">
              <h4 className="font-bold text-on-background mb-2">Shipping Address</h4>
              <p className="text-sm text-charcoal-text leading-relaxed">{selectedOrder.address || "N/A"}</p>
            </div>
            <div className="border border-outline rounded-2xl p-4 bg-surface-tint/10 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-on-background mb-2">Order Summary</h4>
                <div className="flex justify-between text-sm py-1 border-b border-outline border-dashed">
                  <span className="text-charcoal-text">Subtotal</span>
                  <span className="font-bold text-on-background">${Math.max(0, (selectedOrder.total || 0) - (selectedOrder.shipping || 5.00)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-outline border-dashed">
                  <span className="text-charcoal-text">Shipping</span>
                  <span className="font-bold text-on-background">${(selectedOrder.shipping || 5.00).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-extrabold text-on-background pt-3 mt-2 border-t border-outline">
                <span>Total</span>
                <span>${(selectedOrder.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        /* EMPTY ORDERS STATE */
        <div className="text-center py-14 px-4 border border-outline rounded-2xl bg-white shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary mx-auto mb-4">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-on-background">No Orders Found</h3>
          <p className="text-xs text-charcoal-text mt-1 max-w-md mx-auto">
            You haven't placed any orders yet. Explore our products and order items for your beloved pets!
          </p>
          <Link
            to="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-secondary/90 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>Shop Products Now</span>
          </Link>
        </div>
      ) : (
        /* ORDERS LIST */
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const isDelivered = order.status?.toLowerCase() === 'delivered'

            return (
              <div key={order.id} className="border border-outline rounded-2xl p-5 hover:shadow-md transition bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="min-w-0 w-full md:flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-on-background shrink-0">{order.id}</span>
                    <span className="text-xs text-[#8a8f88]">&bull;</span>
                    <span className="text-xs text-charcoal-text">{order.date}</span>
                  </div>
                  
                  <div className="mt-2 text-sm font-semibold text-charcoal-text break-words whitespace-normal">
                    {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>
                  
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-lg font-extrabold text-on-background">${(order.total || 0).toFixed(2)}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      isDelivered
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : order.status?.toLowerCase() === 'cancelled'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t border-outline border-dashed md:border-0 flex-wrap">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 md:flex-none border border-outline-strong bg-white hover:border-primary hover:text-primary rounded-full px-5 py-2 text-xs font-bold transition cursor-pointer text-center"
                  >
                    View Order
                  </button>

                  {isDelivered && (
                    <button
                      type="button"
                      onClick={() => openReviewModal(null, order.items, order.id)}
                      className="flex-1 md:flex-none rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-900 px-5 py-2 text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <Star size={13} className="fill-amber-400 text-amber-500 shrink-0" />
                      <span>Add Review</span>
                    </button>
                  )}

                  {order.status?.toLowerCase() !== 'cancelled' && (
                    <button
                      onClick={() => triggerTracking(order)}
                      className="flex-1 md:flex-none rounded-full bg-secondary hover:bg-secondary/90 px-5 py-2 text-xs font-bold text-white transition cursor-pointer text-center"
                    >
                      Track
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between border border-outline shadow-sm">
              <p className="text-sm font-semibold text-charcoal-text">
                Showing {startIndex + 1}-{endItem} of {totalOrders} orders
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="rounded-full px-4 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 bg-[#fbf7f0] border border-outline hover:border-secondary hover:text-secondary text-on-background cursor-pointer"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold transition cursor-pointer border ${
                        isActive
                          ? "bg-secondary text-white border-transparent shadow-sm"
                          : "bg-white text-on-background border-outline hover:border-[#8a72c7]/40 hover:bg-[#8a72c7]/5"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="rounded-full px-4 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 bg-[#fbf7f0] border border-outline hover:border-secondary hover:text-secondary text-on-background cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Review Modal */}
      <AddReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        item={reviewModalItem}
        orderItems={reviewModalOrderItems}
        onSubmit={handleReviewSubmit}
      />
    </div>
  )
}

