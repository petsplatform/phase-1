import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { CheckCircle, MapPin, ShoppingBag } from "lucide-react";
import { authApi } from "../api/authApi";

const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

const paymentLabel = (id) => {
  if (id === "stripe") return "Paid Online (Card)";
  if (id === "cod") return "Cash on Delivery";
  return id || "—";
};

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const customer = authApi.getCustomer?.();
  const customerEmail = customer?.email || null;

  useEffect(() => {
    const stored = localStorage.getItem("petcare_last_order");
    if (stored) setOrder(JSON.parse(stored));
  }, []);

  return (
    <>
      <SEO title="Order Placed | Best-Vet-Care" description="Your order has been placed successfully." />
      <div className="min-h-screen bg-[#fffdf7]">
        <Header />

        <div className="mx-auto max-w-[580px] px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-[#17345f1a] bg-white p-8 shadow-sm text-center">
            {/* Success icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute -inset-5 rounded-full bg-[#f8f1df]" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#17345f]">
                <CheckCircle className="h-9 w-9 text-[#d9aa3d]" />
              </div>
            </div>

            <h1 className="mt-6 text-2xl font-extrabold text-[#122a50]">Thank You!</h1>
            <p className="mt-2 text-sm font-semibold text-[#122a50]/60">
              Your order has been placed successfully.
            </p>
            {order && customerEmail && (
              <p className="mt-1 text-sm font-semibold text-[#122a50]/60">
                {order.confirmationEmail?.delivered ? (
                  <>
                    We've sent an order confirmation to{" "}
                    <span className="font-extrabold text-[#122a50]">{customerEmail}</span>
                  </>
                ) : (
                  "Your order is saved, but the confirmation email could not be sent."
                )}
              </p>
            )}

            {order && (
              <div className="mt-6 rounded-xl border border-[#17345f1a] bg-[#fffdf7] p-4 text-left">
                <p className="mb-3 text-sm font-extrabold text-[#122a50]">Order Details</p>
                <div className="space-y-2">
                  {[
                    { label: "Order Number", value: order.id },
                    { label: "Order Date", value: order.date },
                    { label: "Total Amount", value: fmt(order.total) },
                    {
                      label: "Payment Method",
                      value: paymentLabel(order.payment),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#122a50]/60">{label}</span>
                      <span className="font-extrabold text-[#122a50]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order?.discount > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#f8f1df] px-3 py-2 text-xs font-semibold text-[#17345f]">
                You saved {fmt(order.discount)} on this order!
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/track-order")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#17345f] py-3 text-sm font-extrabold text-white transition-all hover:bg-[#d9aa3d]"
              >
                <MapPin className="h-4 w-4" />
                Track Your Order
              </button>
              <Link
                to="/products"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#17345f1a] py-3 text-sm font-extrabold text-[#122a50] transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default OrderSuccess;
