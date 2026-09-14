import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, MapPin, ShoppingBag } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { getStoredAuthUser } from "../services/authService";

const fmt = (value) => `$${Number(value || 0).toFixed(2)}`;

function paymentLabel(value) {
  if (value === "stripe") return "Paid Online (Card)";
  if (value === "cod") return "Cash on Delivery";
  return value || "-";
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const user = getStoredAuthUser();

  useEffect(() => {
    try {
      const storedOrder = localStorage.getItem("healthy_paws_last_order");
      if (storedOrder) setOrder(JSON.parse(storedOrder));
    } catch {
      setOrder(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Header />
      <main className="mx-auto max-w-[620px] px-4 py-10 sm:px-6">
        <section className="rounded-[22px] border border-borderSoft bg-white p-8 text-center shadow-contact">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-5 rounded-full bg-sageLight" />
            <div className="relative grid size-16 place-items-center rounded-full bg-secondaryDark">
              <CheckCircle className="size-9 text-orange" />
            </div>
          </div>

          <h1 className="mt-6 font-display text-[30px] font-extrabold text-textMain">Thank You!</h1>
          <p className="mt-2 text-[14px] font-semibold text-muted">Your order has been placed successfully.</p>

          {order && (
            <p className="mt-1 text-[14px] font-semibold text-muted">
              {order.confirmationEmail?.delivered && user?.email ? (
                <>
                  We&apos;ve sent an order confirmation to{" "}
                  <span className="font-extrabold text-textMain">{user.email}</span>
                </>
              ) : (
                "Your order is saved. You can track it from your account."
              )}
            </p>
          )}

          {order && (
            <div className="mt-6 rounded-xl border border-borderSoft bg-background p-4 text-left">
              <p className="mb-3 text-[14px] font-extrabold text-textMain">Order Details</p>
              <div className="grid gap-2">
                <Row label="Order Number" value={order.id} />
                <Row label="Order Date" value={order.date} />
                <Row label="Total Amount" value={fmt(order.total)} />
                <Row label="Payment Method" value={paymentLabel(order.payment)} />
              </div>
            </div>
          )}

          {Number(order?.discount || 0) > 0 && (
            <div className="mt-4 rounded-lg bg-sageLight px-3 py-2 text-[12px] font-extrabold text-secondaryDark">
              You saved {fmt(order.discount)} on this order.
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/account/track-order")}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondaryDark px-4 text-[14px] font-extrabold text-white transition hover:bg-primaryDark"
            >
              <MapPin className="size-4" />
              Track Your Order
            </button>
            <Link
              to="/products"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-borderSoft px-4 text-[14px] font-extrabold text-textMain transition hover:border-secondary hover:bg-sageLight hover:text-secondaryDark"
            >
              <ShoppingBag className="size-4" />
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[14px]">
      <span className="font-semibold text-muted">{label}</span>
      <span className="text-right font-extrabold text-textMain">{value}</span>
    </div>
  );
}
