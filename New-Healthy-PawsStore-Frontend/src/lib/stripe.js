import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
export const stripePublishableKey = publishableKey;
export const stripeCurrency = (import.meta.env.VITE_STRIPE_CURRENCY || "usd").toLowerCase();
