import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, ShieldCheck } from "lucide-react";
import { showToast } from "../common/toast/ToastHelper";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_TYooMQauvdEDq54NiTphI7jx",
);

const stripeAppearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#58B947",
    colorBackground: "#ffffff",
    colorText: "#0f2d52",
    colorDanger: "#ef4444",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    spacingUnit: "4px",
    borderRadius: "16px",
  },
};

export default function StripePayment({
  clientSecret,
  handleSubmitOrder,
  totalAmount,
  submittingOrder,
  resetPaymentSession,
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: stripeAppearance,
      }}
    >
      <StripePaymentForm
        handleSubmitOrder={handleSubmitOrder}
        totalAmount={totalAmount}
        submittingOrder={submittingOrder}
        resetPaymentSession={resetPaymentSession}
      />
    </Elements>
  );
}

function StripePaymentForm({
  handleSubmitOrder,
  totalAmount,
  submittingOrder,
  resetPaymentSession,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        showToast.error(result.error.message || "Payment failed");
        if (
          result.error.code === "payment_intent_unexpected_state" ||
          (result.error.message &&
            result.error.message.includes("already succeeded"))
        ) {
          resetPaymentSession?.();
        }
        setProcessing(false);
      } else if (result.paymentIntent?.status === "succeeded") {
        showToast.success("Payment succeeded!");
        try {
          await handleSubmitOrder(result.paymentIntent.id);
        } catch (err) {
          console.error("Order creation failed after payment:", err);
          resetPaymentSession?.();
        }
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      showToast.error(
        err.message || "Payment processing failed. Please try again.",
      );
      resetPaymentSession?.();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handlePay}
      className="mt-6 space-y-5 font-sans animate-fade-in text-left"
    >
      <div className="space-y-4">
        <div className="p-5 border border-slate-200 rounded-3xl bg-white focus-within:border-primary-green focus-within:ring-2 focus-within:ring-primary-green/10 transition-all shadow-3xs">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Card Details
            </label>
            <span className="flex items-center gap-1.5 text-[10px] text-primary-green font-extrabold uppercase tracking-wide">
              <Lock className="h-3 w-3" /> Secure SSL Connection
            </span>
          </div>
          <div className="py-2.5 px-1 border-t border-slate-100 mt-2">
            <PaymentElement className="w-full" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1 text-[11px] font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
              <ShieldCheck className="h-3.5 w-3.5" /> 256-bit SSL Encryption
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by</span>
            <svg viewBox="0 0 60 25" className="h-5 w-auto text-[#635BFF] fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M51.01 10.53c0-3.32-2.31-6.1-5.94-6.1-3.66 0-5.97 2.78-5.97 6.1 0 3.28 2.31 6.09 5.97 6.09 3.63 0 5.94-2.81 5.94-6.09zm-8.83 0c0-1.87 1.15-3.3 2.89-3.3 1.76 0 2.91 1.43 2.91 3.3 0 1.88-1.15 3.3-2.91 3.3-1.74 0-2.89-1.42-2.89-3.3zm21.43-3.1h-2.9v-.81c0-1.39.81-1.81 2.22-1.81.56 0 1.05.07 1.45.18V2.19c-.56-.17-1.36-.26-2.28-.26-3.23 0-4.33 1.54-4.33 4.41v1.12h-1.81v2.79h1.81v8.28h2.94V10.3h2.9V7.43zm-27.1 2.5c-.88-.41-1.92-.68-2.94-.68-1.63 0-2.43.64-2.43 1.52 0 .91.89 1.28 2.71 1.76 2.35.61 4.54 1.25 4.54 4.06 0 3.1-2.52 4.47-5.75 4.47-1.57 0-3.2-.33-4.37-.92v-3.08c1.19.64 2.65.98 3.96.98 1.45 0 2.22-.51 2.22-1.39 0-.95-.91-1.33-2.95-1.84-2.27-.57-4.3-1.32-4.3-3.95 0-2.89 2.34-4.39 5.48-4.39 1.49 0 2.88.29 3.84.73v3.08zm-9.87-8.02h-2.94v2.7h2.94V1.91zm0 5.52h-2.94v10.1h2.94V7.43zm-5.78 0H18.1v2.18c-.53-.8-1.51-2.54-4.14-2.54-2.85 0-5.1 2.45-5.1 6.1 0 3.61 2.25 6.09 5.1 6.09 2.63 0 3.61-1.74 4.14-2.54v2.22h2.94V7.43zm-6.17 6.35c-1.54 0-2.61-1.33-2.61-3.25 0-1.91 1.07-3.25 2.61-3.25 1.54 0 2.6 1.34 2.6 3.25 0 1.92-1.06 3.25-2.6 3.25zM2.87 9.87c.75-.41 1.63-.64 2.44-.64.91 0 1.39.3 1.39.95 0 .61-.58.85-1.56 1.12C3.12 11.83 1 12.44 1 14.54c0 2.23 1.84 3.09 4.19 3.09 1.57 0 2.82-.61 3.32-1.3v1.1h2.94V9.66c0-3.32-2.18-4.7-5.59-4.7-1.42 0-2.88.3-3.83.84v2.96c.92-.51 2.05-.89 3.01-.89 1.59 0 2.44.57 2.44 1.55 0 .3-.07.57-.27.78-.34-.51-1.29-1.22-2.83-1.22-2.27 0-4.07 1.63-4.07 4.09 0 2.44 1.8 4.09 4.07 4.09 1.81 0 2.76-1.12 3.12-1.84V16.3c-.5.68-1.48 2.09-3.79 2.09-2.9 0-5.07-2.3-5.07-6.09 0-3.79 2.17-6.09 5.07-6.09zm0 0c.92-.51 2.05-.89 3.01-.89 1.59 0 2.44.57 2.44 1.55 0 .31-.07.58-.27.79v-2.34zm6.05 4.67c0-1.8 1.15-2.91 2.89-2.91s2.89 1.11 2.89 2.91-1.15 2.9-2.89 2.9-2.89-1.1-2.89-2.9zm17.65 1.76V7.43H23.6v10.1h2.94v-5.71c0-1.63.85-2.58 2.18-2.58.33 0 .61.03.81.08V7.43c-.27-.05-.55-.08-.85-.08-1.57 0-2.56.91-3.04 1.79zm13.1-6.43v-2.7h-2.94v2.7h-1.81v2.79h1.81v8.28h2.94V10.3h1.81V7.43h-1.81z" />
            </svg>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={processing || submittingOrder || !stripe}
        className="w-full h-14 rounded-full bg-linear-to-br from-primary-green to-dark-green text-white font-extrabold text-[15px] sm:text-base tracking-wide transition-all shadow-[0_12px_24px_rgba(88,185,71,0.22)] hover:shadow-[0_16px_32px_rgba(88,185,71,0.32)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
      >
        {processing || submittingOrder
          ? "Processing Payment..."
          : `Pay Now ($${totalAmount.toFixed(2)})`}
        <ShieldCheck className="h-5 w-5" />
      </button>
    </form>
  );
}
