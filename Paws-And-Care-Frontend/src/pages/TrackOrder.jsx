import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Search, ChevronRight, Package, MapPin, CheckCircle2, Clock, AlertCircle, Phone, Mail } from 'lucide-react';
import { useOrders } from '../context/OrderContext';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_COLORS = {
  out_for_delivery: 'text-brand-golden bg-brand-golden/10 border-brand-golden/30',
  shipped:          'text-brand-teal bg-brand-teal/10 border-brand-teal/30',
  delivered:        'text-green-600 bg-green-50 border-green-200',
  processing:       'text-brand-muted bg-brand-bg border-brand-border',
  order_confirmed:  'text-brand-teal bg-brand-teal/10 border-brand-teal/30',
};

const STATUS_LABELS = {
  out_for_delivery: 'Out for Delivery',
  shipped:          'Shipped',
  delivered:        'Delivered',
  processing:       'Processing',
  order_confirmed:  'Order Placed',
};

export default function TrackOrder() {
  const { orders = [] } = useOrders() || {};
  const [orderId, setOrderId]     = useState('');
  const [contact, setContact]     = useState('');
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const trimId = orderId.trim();

    if (!trimId) {
      setError('Please enter your Order ID.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const backendOrder = orders.find((order) => {
        return String(order.orderId).toLowerCase() === trimId.toLowerCase();
      });

      if (backendOrder) {
        const rawStatus = String(backendOrder.orderStatus || '').toLowerCase().replace(/_/g, '').replace(/\s+/g, '');
        const isShipped = rawStatus.includes('shipped') || rawStatus.includes('outfor') || rawStatus.includes('delivered');
        const isOut = rawStatus.includes('outfor');
        const isDelivered = rawStatus.includes('delivered') && !isOut;

        const estDelivery = (() => {
          if (backendOrder.deliveryEstimate && backendOrder.deliveryEstimate !== '3-5 business days' && backendOrder.deliveryEstimate !== 'N/A') {
            return backendOrder.deliveryEstimate;
          }
          const raw = backendOrder.estimatedDeliveryDate || backendOrder.estimatedDelivery || backendOrder.shipment?.estimatedDeliveryDate;
          if (raw && raw !== '—' && raw !== '3-5 business days') {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            return raw;
          }
          return 'N/A';
        })();

        setResult({
          orderId: backendOrder.orderId,
          status: String(backendOrder.orderStatus || 'processing').toLowerCase().replaceAll(' ', '_'),
          product: backendOrder.items.map((item) => item.name).join(' + '),
          courierName: backendOrder.courierName || 'N/A',
          trackingNumber: backendOrder.trackingNumber || 'N/A',
          awbNumber: backendOrder.awbNumber || 'N/A',
          estimatedDelivery: estDelivery,
          placedOn: backendOrder.orderDate ? fmtDate(backendOrder.orderDate) : '',
          steps: [
            { label: 'Order Placed', done: true, date: backendOrder.orderDate ? fmtDate(backendOrder.orderDate) : '' },
            { label: 'Processing', done: !['pending'].includes(rawStatus), date: '' },
            { label: 'Shipped', done: isShipped, date: '' },
            { label: 'Out for Delivery', done: isOut || isDelivered, date: '' },
            { label: 'Delivered', done: isDelivered, date: '' },
          ],
        });
      } else {
        setError('No order found with that ID. Please check the order ID and try again.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="bg-brand-bg min-h-[80vh] pb-16 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-muted mb-6 flex-wrap">
          <Link to="/" className="hover:text-brand-teal transition-colors">Home</Link>
          <ChevronRight size={10} className="text-brand-border" />
          <span className="text-brand-text font-semibold">Track Order</span>
        </nav>

        {/* Hero Header */}
        <div className="text-left mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-brand-teal/10 text-brand-teal text-[11px] font-heading font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <Truck size={11} />
            <span>Order Tracking</span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-brand-text leading-tight">
            Track Your Order
          </h1>
          <p className="font-sans text-sm sm:text-base text-brand-muted leading-relaxed max-w-lg">
            Enter your Order ID to get real-time delivery updates.
          </p>
        </div>

        {/* Search Form Card */}
        <div className="bg-brand-surface border border-brand-border/60 rounded-[2rem] p-6 sm:p-8 shadow-sm mb-6">
          <form onSubmit={handleTrack} className="space-y-4" noValidate>
            {/* Order ID */}
            <div className="space-y-1.5">
              <label htmlFor="track-order-id" className="block font-heading font-bold text-xs uppercase tracking-wide text-brand-text">
                Order ID
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Package size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                  <input
                    id="track-order-id"
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. PAW-001234"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-brand-border bg-brand-bg/50 text-brand-text text-sm font-sans placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-teal focus:bg-white transition-all duration-200"
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-deep-teal disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-heading font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
                  aria-label="Track order"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Tracking...</span>
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      <span>Track Order</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] font-sans text-brand-muted pl-1">
                You'll find this in your order confirmation email.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 bg-brand-coral/5 border border-brand-coral/25 text-brand-coral rounded-xl px-4 py-3 text-xs font-sans">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Order Status Result */}
        {result && (
          <div className="bg-brand-surface border border-brand-border/60 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-heading font-black text-lg text-brand-text">#{result.orderId}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-heading font-black ${STATUS_COLORS[result.status]}`}>
                <Truck size={11} />
                {STATUS_LABELS[result.status]}
              </span>
            </div>

            {/* Product & Delivery estimate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-brand-bg/40 rounded-2xl p-4 border border-brand-border/40 space-y-0.5">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">Items</p>
                <p className="font-sans text-sm text-brand-text font-semibold leading-snug">{result.product}</p>
              </div>
              <div className="bg-brand-teal/5 rounded-2xl p-4 border border-brand-teal/20 space-y-0.5">
                <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-brand-muted">Estimated Delivery</p>
                <p className="font-heading font-black text-sm text-brand-teal">{result.estimatedDelivery}</p>
              </div>
            </div>

            {/* Progress tracker */}
            <div>
              <p className="font-heading font-black text-sm text-brand-text mb-4">Shipment Progress</p>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-brand-border/60" />

                <div className="space-y-5">
                  {result.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-4 relative">
                      {/* Step dot */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 z-10 transition-all duration-200 ${
                        step.done
                          ? 'bg-brand-teal border-brand-teal text-white shadow-sm'
                          : 'bg-white border-brand-border text-brand-muted'
                      }`}>
                        {step.done
                          ? <CheckCircle2 size={16} />
                          : <Clock size={14} />
                        }
                      </div>
                      {/* Step label */}
                      <div className="pt-1.5">
                        <p className={`font-heading font-black text-sm leading-none ${step.done ? 'text-brand-text' : 'text-brand-muted'}`}>
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="font-sans text-[11px] text-brand-muted mt-0.5">{step.date}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Support footer */}
            <div className="flex items-center gap-3 bg-brand-peach/40 border border-brand-border/40 rounded-2xl p-4">
              <Phone size={15} className="text-brand-teal shrink-0" />
              <p className="font-sans text-xs text-brand-muted leading-relaxed">
                Issue with your delivery? <Link to="/contact" className="font-bold text-brand-teal hover:text-brand-coral underline underline-offset-2 transition-colors">Contact Support</Link>
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
