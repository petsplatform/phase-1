import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Lock } from "lucide-react";
import { stripePromise } from "../../lib/stripe";
import { paymentApi } from "../../api/paymentApi";

const paymentOptions = [
  { id: "stripe", label: "Pay Online", sub: "Card, Apple Pay, Google Pay" },
];

const toMinorUnit = (amount) => Math.round(Number(amount || 0) * 100);

const isLocalPaymentIntent = (paymentIntentId) =>
  String(paymentIntentId || "").startsWith("pi_local_");

const LocalPaymentForm = ({ onReady, paymentIntentId, total, checkoutPayload, currency }) => {
  useEffect(() => {
    if (!paymentIntentId) return;
    onReady(async () => {
      const updatedIntent = await paymentApi.updateIntentAmount(paymentIntentId, checkoutPayload, currency);
      const expectedAmount = toMinorUnit(total);
      if (updatedIntent.amount !== expectedAmount) {
        throw new Error(
          `Payment amount does not match this order. Paid ${(updatedIntent.amount / 100).toFixed(2)}, expected ${Number(total || 0).toFixed(2)}. Please refresh checkout and try again.`,
        );
      }
      return { paymentIntent: { id: paymentIntentId, status: "succeeded" } };
    });
  }, [onReady, paymentIntentId, total, checkoutPayload, currency]);

  return (
    <p className="text-sm font-semibold text-[#122a50]/60">
      Local payment simulator ready.
    </p>
  );
};

const StripePaymentForm = ({ onReady, paymentIntentId, total, checkoutPayload, currency }) => {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements || !paymentIntentId) return;
    onReady(async () => {
      // Re-sync the PaymentIntent's amount right before confirming, so a
      // late-applied discount can never leave a stale amount on Stripe's
      // side that would fail server-side verification after payment.
      const updatedIntent = await paymentApi.updateIntentAmount(paymentIntentId, checkoutPayload, currency);
      if (updatedIntent?.status === "succeeded") {
        const expectedAmount = toMinorUnit(total);
        if (updatedIntent.amount !== expectedAmount) {
          throw new Error(
            `Payment amount does not match this order. Paid ${(updatedIntent.amount / 100).toFixed(2)}, expected ${Number(total || 0).toFixed(2)}. Please refresh checkout and try again.`,
          );
        }
        return { paymentIntent: { id: paymentIntentId, status: "succeeded" } };
      }
      return stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/checkout` },
        redirect: "if_required",
      });
    });
  }, [stripe, elements, onReady, paymentIntentId, total, checkoutPayload, currency]);

  return <PaymentElement />;
};

const PaymentStep = ({
  selectedPayment,
  setSelectedPayment,
  total,
  checkoutPayload,
  onStripeReady,
  locked = false,
}) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [stripeMissingKey, setStripeMissingKey] = useState(false);
  const [intentError, setIntentError] = useState("");
  const currency = import.meta.env.VITE_STRIPE_CURRENCY || "usd";
  const amountKey = toMinorUnit(total);

  useEffect(() => {
    stripePromise.then((stripe) => {
      if (!stripe) setStripeMissingKey(true);
    });
  }, []);

  useEffect(() => {
    if (selectedPayment !== "stripe") {
      setClientSecret(null);
      setPaymentIntentId(null);
      setIntentError("");
      onStripeReady?.(null);
    }
  }, [selectedPayment, onStripeReady]);

  useEffect(() => {
    if (selectedPayment !== "stripe") return;
    if (amountKey <= 0) {
      setClientSecret(null);
      setPaymentIntentId(null);
      setIntentError("Order total must be greater than zero for online payment.");
      onStripeReady?.(null);
      return;
    }

    let cancelled = false;
    setClientSecret(null);
    setPaymentIntentId(null);
    setIntentError("");
    onStripeReady?.(null);

    paymentApi
      .createIntent(checkoutPayload, currency)
      .then(({ clientSecret: secret, paymentIntentId: id }) => {
        if (cancelled) return;
        setClientSecret(secret);
        setPaymentIntentId(id);
      })
      .catch((err) => {
        if (cancelled) return;
        setIntentError(err.response?.data?.message || err.message || "Could not load the payment form.");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPayment, amountKey, total, checkoutPayload, currency, onStripeReady]);

  return (
    <div
      className={`rounded-2xl border border-[#17345f1a] bg-white shadow-sm transition-opacity ${
        locked ? "pointer-events-none opacity-50 grayscale-[0.4]" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#17345f1a] px-5 py-4">
        <h2 className="flex items-center gap-2 font-extrabold text-[#122a50]">
          <CreditCard className="h-5 w-5 text-[#d9aa3d]" />
          Payment Method
        </h2>
        {locked && <Lock className="h-4 w-4 text-[#122a50]/40" />}
      </div>

      <div className="space-y-3 p-5">
        {paymentOptions.map((opt) => (
          <div key={opt.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                selectedPayment === opt.id
                  ? "border-[#17345f] bg-[#f8f1df]"
                  : "border-[#17345f1a] hover:border-[#17345f]/30"
              }`}
            >
              <input
                type="radio"
                name="payment"
                className="accent-[#17345f]"
                checked={selectedPayment === opt.id}
                onChange={() => setSelectedPayment(opt.id)}
              />
              <div className="flex-1">
                <p className="text-sm font-extrabold text-[#122a50]">{opt.label}</p>
                <p className="text-xs font-semibold text-[#122a50]/60">{opt.sub}</p>
              </div>
            </label>

            {opt.id === "stripe" && selectedPayment === "stripe" && (
              <div className="mt-2 rounded-xl border border-[#17345f1a] bg-[#fffdf7] p-4">
                {stripeMissingKey ? (
                  <p className="text-sm font-semibold text-red-600">
                    Online payments aren&apos;t configured yet (missing Stripe publishable key).
                  </p>
                ) : intentError ? (
                  <p className="text-sm font-semibold text-red-600">{intentError}</p>
                ) : clientSecret && isLocalPaymentIntent(paymentIntentId) ? (
                  <LocalPaymentForm
                    onReady={onStripeReady}
                    paymentIntentId={paymentIntentId}
                    total={total}
                    checkoutPayload={checkoutPayload}
                    currency={currency}
                  />
                ) : clientSecret ? (
                  <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                    <StripePaymentForm
                      onReady={onStripeReady}
                      paymentIntentId={paymentIntentId}
                      total={total}
                      checkoutPayload={checkoutPayload}
                      currency={currency}
                    />
                  </Elements>
                ) : (
                  <p className="text-sm font-semibold text-[#122a50]/60">Loading payment form…</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentStep;
