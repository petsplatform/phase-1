import { Elements } from "@stripe/react-stripe-js";
import { CreditCard, Lock } from "lucide-react";
import CardPaymentForm from "./CardPaymentForm";
import { stripePromise } from "../../lib/stripe";

export default function PaymentMethod({
  register,
  paymentMethod,
  clientSecret,
  paymentLoading,
  paymentError,
  onStripeReady,
  onPaymentCompleteChange,
  onCardError,
  hasError = false,
  locked = false,
}) {
  return (
    <section
      id="payment-section"
      className={`rounded-[20px] border transition-all ${
        hasError || paymentError
          ? "border-red-300 bg-red-50/10 shadow-md ring-2 ring-red-200"
          : "border-borderSoft bg-white shadow-contact"
      } ${locked ? "pointer-events-none opacity-50 grayscale-[0.35]" : ""}`}
    >
      <div className="flex min-w-0 items-center justify-between border-b border-borderSoft px-4 py-4 sm:px-7">
        <h2 className="flex items-center gap-2 font-display text-[18px] sm:text-[20px] font-extrabold text-textMain">
          <CreditCard className="size-5 text-orange shrink-0" />
          Payment Method
        </h2>
        {locked && <Lock className="size-4 text-muted shrink-0" />}
      </div>

      {(paymentError || hasError) && (
        <div className="m-3.5 mb-0 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[13px] font-bold text-red-700 sm:m-7 sm:mb-0">
          <span className="font-extrabold">⚠️ Payment Error:</span>
          <span>{paymentError || "Please check and complete your card details below."}</span>
        </div>
      )}

      <fieldset className="m-3.5 overflow-hidden rounded-xl border border-borderSoft sm:m-7">
        <legend className="sr-only">Payment method</legend>
        <label className={`flex items-center gap-3 px-4 py-4 ${paymentMethod === "stripe" ? "bg-softCream" : ""}`}>
          <input type="radio" value="stripe" {...register("paymentMethod")} className="size-5 accent-secondaryDark" />
          <span className="min-w-0 flex-1">
            <strong className="block text-[14px] font-extrabold text-textMain">Pay Online</strong>
            <span className="text-[12px] font-semibold text-muted">Card, Apple Pay, Google Pay</span>
          </span>
        </label>
        {paymentMethod === "stripe" && (
          <StripeCardPanel
            clientSecret={clientSecret}
            loading={paymentLoading}
            error={paymentError}
            onStripeReady={onStripeReady}
            onPaymentCompleteChange={onPaymentCompleteChange}
            onCardError={onCardError}
          />
        )}
      </fieldset>
    </section>
  );
}

function StripeCardPanel({ clientSecret, loading, error, onStripeReady, onPaymentCompleteChange, onCardError }) {
  if (error) {
    return <p className="border-t border-borderSoft px-4 py-4 text-[13px] font-extrabold text-error">{error}</p>;
  }

  if (loading) {
    return <p className="border-t border-borderSoft px-4 py-4 text-[13px] font-semibold text-muted">Preparing secure card payment...</p>;
  }

  if (!stripePromise) {
    return (
      <p className="border-t border-borderSoft px-4 py-4 text-[13px] font-extrabold text-error">
        Stripe publishable key is missing. Add VITE_STRIPE_PUBLISHABLE_KEY and restart the storefront.
      </p>
    );
  }

  if (!clientSecret) {
    return (
      <p className="border-t border-borderSoft px-4 py-4 text-[13px] font-semibold text-muted">
        Enter your name and phone number to load secure card payment.
      </p>
    );
  }

  return (
    <Elements
      key={clientSecret}
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0f3d3e",
            colorText: "#10284a",
            borderRadius: "10px",
            fontFamily: "Inter, system-ui, sans-serif",
          },
        },
      }}
    >
      <CardPaymentForm
        onStripeReady={onStripeReady}
        onCompleteChange={onPaymentCompleteChange}
        onCardError={onCardError}
      />
    </Elements>
  );
}
