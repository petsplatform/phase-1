import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { paymentApi } from "../../api/paymentApi";
import { stripePromise } from "../../lib/stripe";

const toMinorUnit = (amount) => Math.round(Number(amount || 0) * 100);

function StripePaymentForm({ onReady, paymentIntentId, total, checkoutPayload, currency }) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements || !paymentIntentId) return;

    onReady(async () => {
      const updatedIntent = await paymentApi.updateIntentAmount(
        paymentIntentId,
        checkoutPayload,
        currency,
      );

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
}

export default function StripePaymentElement({ active, total, checkoutPayload, onReady }) {
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
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
    if (!active) {
      queueMicrotask(() => {
        setClientSecret("");
        setPaymentIntentId("");
        setIntentError("");
      });
      onReady?.(null);
      return;
    }

    if (amountKey <= 0) {
      queueMicrotask(() => {
        setClientSecret("");
        setPaymentIntentId("");
        setIntentError("Order total must be greater than zero for online payment.");
      });
      onReady?.(null);
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      setClientSecret("");
      setPaymentIntentId("");
      setIntentError("");
    });
    onReady?.(null);

    paymentApi
      .createIntent(checkoutPayload, currency)
      .then(({ clientSecret: secret, paymentIntentId: id }) => {
        if (cancelled) return;
        setClientSecret(secret);
        setPaymentIntentId(id);
      })
      .catch((error) => {
        if (cancelled) return;
        setIntentError(
          error.response?.data?.message || error.message || "Could not load the payment form.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [active, amountKey, checkoutPayload, currency, onReady]);

  if (!active) return null;

  return (
    <div className="mt-4 rounded-xl border border-[#e5ddf0] bg-white p-4">
      {stripeMissingKey ? (
        <p className="text-sm font-semibold text-red-600">
          Online payments are not configured yet. Add VITE_STRIPE_PUBLISHABLE_KEY.
        </p>
      ) : intentError ? (
        <p className="text-sm font-semibold text-red-600">{intentError}</p>
      ) : clientSecret ? (
        <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm
            onReady={onReady}
            paymentIntentId={paymentIntentId}
            total={total}
            checkoutPayload={checkoutPayload}
            currency={currency}
          />
        </Elements>
      ) : (
        <p className="text-sm font-semibold text-brand-brown/60">Loading payment form...</p>
      )}
    </div>
  );
}
