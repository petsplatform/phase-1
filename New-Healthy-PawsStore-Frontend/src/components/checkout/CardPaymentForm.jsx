import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function CardPaymentForm({ onStripeReady, onCompleteChange, onCardError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState("");

  useEffect(() => {
    onStripeReady?.({ stripe, elements });
  }, [elements, onStripeReady, stripe]);

  const handleChange = (event) => {
    onCompleteChange?.(event.complete);
    if (event.error) {
      const msg = event.error.message || "Please complete your card details.";
      setCardError(msg);
      onCardError?.(msg);
    } else {
      setCardError("");
      onCardError?.("");
    }
  };

  return (
    <div className="border-t border-borderSoft px-4 py-4">
      <PaymentElement
        onChange={handleChange}
        options={{
          layout: "tabs",
          defaultValues: {
            billingDetails: {
              address: {
                country: "US",
              },
            },
          },
        }}
      />

      {cardError && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[12px] font-extrabold text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{cardError}</span>
        </div>
      )}

      <p className="mt-3 text-[12px] font-semibold leading-relaxed text-muted">
        Card details are encrypted by Stripe and never stored on this site.
      </p>
    </div>
  );
}
