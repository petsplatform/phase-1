import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { 
  Check, 
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Lock,
  HelpCircle
} from 'lucide-react';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { lookupOrder } = useOrders();

  const order = useMemo(() => {
    return lookupOrder(orderId);
  }, [orderId, lookupOrder]);

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-bg px-4 py-16 text-center font-sans">
        <HelpCircle size={48} className="text-brand-coral mb-4" />
        <h1 className="font-heading font-black text-2xl text-brand-text mb-2">Order Not Found</h1>
        <p className="font-sans text-brand-muted text-sm max-w-md mb-6">
          We couldn't load details for this order. It might still be processing.
        </p>
        <Link 
          to="/shop" 
          className="bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-6 py-2.5 font-heading font-bold text-sm transition-colors cursor-pointer"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const customerName = order.contactDetails 
    ? `${order.contactDetails.firstName || ''} ${order.contactDetails.lastName || ''}`.trim() || 'Valued Customer'
    : 'Valued Customer';

  return (
    <div className="bg-brand-bg min-h-screen pb-20 pt-8 font-sans">
      
      {/* Self-contained Custom Animations */}
      <style>{`
        @keyframes popCheckCircle {
          0% { transform: scale(0.6); opacity: 0; }
          90% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheckLine {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        .pop-check-circle {
          animation: popCheckCircle 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .draw-check-line {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawCheckLine 0.4s ease-out 0.35s forwards;
        }
      `}</style>

      {/* Main Centered Container */}
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Animated Checkmark Icon & Welcome Badge/Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          
          {/* Animated Success Checkmark */}
          <div className="w-20 h-20 bg-brand-teal text-white rounded-full flex items-center justify-center shadow-md border-4 border-white pop-check-circle">
            <svg className="w-10 h-10 stroke-current text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3.5}>
              <path className="draw-check-line" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Small badge: Order Confirmed */}
          <span className="inline-block bg-brand-teal/10 text-brand-teal font-heading font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider select-none">
            Order Confirmed
          </span>

          {/* Heading: Thanks, {customerName}. */}
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-brand-text leading-tight tracking-tight">
            Thanks, {customerName}.
          </h1>

          {/* Confirmation message sent to the customer email */}
          <p className="font-sans text-sm text-brand-muted max-w-md leading-relaxed">
            Your order has been placed successfully. A confirmation message and transaction summary have been sent to{' '}
            <strong className="text-brand-text">{order.contactDetails?.email}</strong>.
          </p>
        </div>

        {/* Premium Confirmation Card (Original Design with Soft Peach Borders and Shadow) */}
        <div className="bg-white border border-brand-peach rounded-[2.5rem] p-6 sm:p-10 shadow-lg shadow-brand-peach/15 space-y-6 text-left">
          
          {/* Section 1: Order Meta Row (Reference ID, Date, Payment Status) */}
          <div className="grid grid-cols-3 gap-2 py-4 px-5 bg-brand-bg/40 border border-brand-peach rounded-2xl text-center text-xs font-sans">
            <div className="space-y-1">
              <span className="block text-[10px] font-heading font-black text-brand-muted uppercase tracking-wide">Unique Reference</span>
              <strong className="block text-xs font-heading font-black text-brand-text uppercase">#{order.orderId}</strong>
            </div>
            <div className="space-y-1 border-x border-brand-border">
              <span className="block text-[10px] font-heading font-black text-brand-muted uppercase tracking-wide">Order Date</span>
              <strong className="block text-[11px] font-semibold text-brand-text">{order.orderDate}</strong>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-heading font-black text-brand-muted uppercase tracking-wide">Payment Status</span>
              <strong className="block text-[11px] text-brand-teal font-heading font-bold uppercase tracking-wider">Paid Online</strong>
            </div>
          </div>

          {/* Section 2: Ordered Items Summary */}
          <div className="space-y-3.5">
            <h3 className="font-heading font-black text-xs text-brand-muted uppercase tracking-wider">
              Items Ordered
            </h3>
            
            <div className="space-y-4 border-b border-brand-border/60 pb-5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 py-1">
                  <img 
                    src={item.image || '/vite.svg'} 
                    alt={item.name} 
                    className="w-14 h-14 object-cover rounded-xl border border-brand-border bg-brand-bg shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <h4 className="font-heading font-black text-sm text-brand-text truncate leading-tight flex items-center gap-1.5">
                      <span className="truncate">{item.name}</span>
                      {(item.prescriptionRequired || item.prescriptionUrl) && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                          Rx Required
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-brand-muted font-sans mt-0.5">
                      <span>Quantity: <strong className="text-brand-text">{item.quantity}</strong></span>
                      <span>·</span>
                      <span>Unit Price: <strong className="text-brand-text">${item.price.toFixed(2)}</strong></span>
                      {item.option && (
                        <>
                          <span>·</span>
                          <span>Option: <strong className="text-brand-text">{item.option}</strong></span>
                        </>
                      )}
                    </div>
                    {item.prescriptionUrl && (
                      <a
                        href={item.prescriptionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-teal hover:underline mt-1"
                      >
                        <span>View Uploaded Prescription</span>
                      </a>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-heading font-black text-sm text-brand-text">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Paid Row */}
            <div className="flex justify-between items-center pt-1 px-1">
              <span className="font-heading font-black text-sm text-brand-text uppercase tracking-wider">Total Paid</span>
              <span className="font-heading font-black text-2xl text-brand-coral">${order.pricing?.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Section 3: Contact Information & Complete Delivery Address */}
          <div className="border-t border-brand-border/60 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            
            {/* Contact Information */}
            <div className="space-y-2 font-sans text-xs sm:text-sm">
              <h4 className="text-[10px] font-heading font-black text-brand-teal uppercase tracking-wider">
                Contact Information
              </h4>
              <div className="text-brand-muted space-y-1.5 pt-0.5">
                <p className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-bold text-brand-muted/70 uppercase">Name:</span>
                  <span className="text-brand-text font-black">{customerName}</span>
                </p>
                {order.contactDetails?.email && (
                  <p className="flex items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-brand-muted/70 uppercase">Email:</span>
                    <span className="text-brand-text font-medium">{order.contactDetails.email}</span>
                  </p>
                )}
                {order.contactDetails?.mobile && (
                  <p className="flex items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-brand-muted/70 uppercase">Phone:</span>
                    <span className="text-brand-text font-medium">{order.contactDetails.mobile}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Complete Delivery Address */}
            <div className="space-y-2 font-sans text-xs sm:text-sm">
              <h4 className="text-[10px] font-heading font-black text-brand-teal uppercase tracking-wider">
                Complete Delivery Address
              </h4>
              <div className="text-brand-muted space-y-1.5 pt-0.5">
                <p className="flex items-start gap-1.5 text-xs leading-normal">
                  <span className="text-[10px] font-bold text-brand-muted/70 uppercase mt-0.5 shrink-0">Address:</span>
                  <span className="flex items-start gap-1 text-brand-text font-medium">
                    <MapPin size={12} className="text-brand-muted/60 mt-0.5 shrink-0" />
                    <span>
                      {order.shippingAddress?.streetAddress || order.shippingAddress?.addressLine1 || order.shippingAddress?.address || 'Address provided upon dispatch'}
                      {(order.shippingAddress?.apartment || order.shippingAddress?.addressLine2) && `, ${order.shippingAddress.apartment || order.shippingAddress.addressLine2}`}
                      {(order.shippingAddress?.city || order.shippingAddress?.state || order.shippingAddress?.postalCode || order.shippingAddress?.zip) ? (
                        <>
                          <br />
                          {[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')}{' '}
                          {order.shippingAddress?.postalCode || order.shippingAddress?.zip}
                        </>
                      ) : null}
                      {order.shippingAddress?.country && order.shippingAddress?.country !== 'United States' ? (
                        <>
                          <br />
                          {order.shippingAddress.country}
                        </>
                      ) : null}
                    </span>
                  </span>
                </p>
              </div>
            </div>

          </div>

          {/* Section 4: Account Confirmation & Security Note */}
          <div className="border-t border-brand-border/60 pt-5 space-y-2 text-left text-xs font-sans">
            
            {/* Account Created or Verified Confirmation */}
            <div className="flex items-center gap-2 text-brand-teal font-heading font-black uppercase tracking-wider">
              <Lock size={14} className="shrink-0" />
              <span>Account Created & Verified Confirmation</span>
            </div>
            
            {/* Security Note / Message */}
            <p className="text-brand-muted leading-relaxed">
              Your profile has been created/verified successfully using your details. You can securely log in to your account anytime using your email address and a temporary verification code (OTP) sent to your mobile number to review complete order history, manage account preferences, and monitor live delivery tracking.
            </p>
          </div>

        </div>

        {/* Back to Home Button */}
        <div className="flex justify-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-full px-8 py-3.5 font-heading font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
