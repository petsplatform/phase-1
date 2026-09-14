import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import AccountLayout from "../components/account/AccountLayout";
import ConfirmModal from "../components/common/ConfirmModal";
import { autoOrderApi } from "../api/autoOrderApi";
import { useToast } from "../context/ToastContext";
import { stripePromise } from "../lib/stripe";

const statusTone = {
  ACTIVE: "bg-green-50 text-green-700",
  PAUSED: "bg-[#f8f1df] text-[#17345f]",
  PAYMENT_FAILED: "bg-red-50 text-red-600",
  OUT_OF_STOCK: "bg-orange-50 text-orange-700",
  PRESCRIPTION_REQUIRED: "bg-purple-50 text-purple-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-50 text-blue-700",
};

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

export default function AutoOrders() {
  const { showToast } = useToast();
  const [autoOrders, setAutoOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null);
  const [paymentSetupOrder, setPaymentSetupOrder] = useState(null);

  const loadAutoOrders = () => {
    setLoading(true);
    autoOrderApi
      .list()
      .then(setAutoOrders)
      .catch((error) => showToast(error?.response?.data?.message || "Could not load auto orders", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    autoOrderApi
      .list()
      .then((items) => {
        if (active) setAutoOrders(items);
      })
      .catch((error) => {
        if (active) showToast(error?.response?.data?.message || "Could not load auto orders", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const runAction = async () => {
    if (!pendingAction) return;
    try {
      const actions = {
        pause: autoOrderApi.pause,
        resume: autoOrderApi.resume,
        cancel: autoOrderApi.cancel,
      };
      await actions[pendingAction.type](pendingAction.id);
      showToast("Auto order updated");
      loadAutoOrders();
    } catch (error) {
      showToast(error?.response?.data?.message || "Could not update auto order", "error");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <AccountLayout
      title="Auto Orders"
      description="Manage recurring product reorders, delivery dates and renewal status."
    >
      {loading ? (
        <div className="rounded-lg border border-[#17345f1a] bg-white p-8 text-sm font-bold text-[#122a50b2]">
          Loading auto orders...
        </div>
      ) : autoOrders.length === 0 ? (
        <div className="rounded-lg border border-[#17345f1a] bg-white p-8">
          <h2 className="text-lg font-extrabold text-[#122a50]">No auto orders yet</h2>
          <p className="mt-2 text-sm font-semibold text-[#122a50b2]">
            Create one from an eligible product page when you are ready.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {autoOrders.map((autoOrder) => (
            <article key={autoOrder.id} className="rounded-lg border border-[#17345f1a] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-extrabold text-[#122a50]">{autoOrder.productName || "Product"}</h2>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-extrabold ${statusTone[autoOrder.status] || "bg-gray-100 text-gray-600"}`}>
                      {autoOrder.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#122a50b2]">
                    {autoOrder.quantity} x {autoOrder.frequencyLabel}
                    {autoOrder.variantLabel ? ` - ${autoOrder.variantLabel}` : ""}
                  </p>
                  <div className="mt-4 grid gap-3 text-sm font-semibold text-[#122a50] sm:grid-cols-3">
                    <span>
                      <span className="block text-xs uppercase text-[#122a5080]">Next Delivery</span>
                      {formatDate(autoOrder.nextOrderDate)}
                    </span>
                    <span>
                      <span className="block text-xs uppercase text-[#122a5080]">Payment</span>
                      {autoOrder.paymentMethodReference ? "Authorized" : "Needs setup"}
                    </span>
                    <span>
                      <span className="block text-xs uppercase text-[#122a5080]">Auto Renew</span>
                      {autoOrder.autoRenew ? "On" : "Off"}
                    </span>
                  </div>
                  {autoOrder.failureReason && (
                    <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
                      {autoOrder.failureReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {autoOrder.status === "ACTIVE" ? (
                    <button className="rounded-lg border border-[#17345f] px-4 py-2 text-sm font-extrabold text-[#17345f]" onClick={() => setPendingAction({ type: "pause", id: autoOrder.id })}>
                      Pause
                    </button>
                  ) : autoOrder.status === "PAUSED" || autoOrder.status === "PAYMENT_FAILED" || autoOrder.status === "OUT_OF_STOCK" ? (
                    <button className="rounded-lg bg-[#17345f] px-4 py-2 text-sm font-extrabold text-white" onClick={() => setPendingAction({ type: "resume", id: autoOrder.id })}>
                      Resume
                    </button>
                  ) : null}
                  {!["CANCELLED", "COMPLETED"].includes(autoOrder.status) && (
                    <>
                    {!autoOrder.paymentMethodReference && (
                      <button className="rounded-lg bg-[#17345f] px-4 py-2 text-sm font-extrabold text-white" onClick={() => setPaymentSetupOrder(autoOrder)}>
                        Setup auto payment
                      </button>
                    )}
                    <button className="rounded-lg bg-red-50 px-4 py-2 text-sm font-extrabold text-red-600" onClick={() => setPendingAction({ type: "cancel", id: autoOrder.id })}>
                      Cancel
                    </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingAction)}
        title="Confirm auto order change"
        message={`Are you sure you want to ${pendingAction?.type || "update"} this auto order?`}
        confirmLabel="Confirm"
        onCancel={() => setPendingAction(null)}
        onConfirm={runAction}
      />
      <AutoPaymentSetupModal
        autoOrder={paymentSetupOrder}
        onClose={() => setPaymentSetupOrder(null)}
        onSaved={(updated) => {
          setAutoOrders((orders) => orders.map((item) => (item.id === updated.id ? updated : item)));
          setPaymentSetupOrder(null);
          showToast("Auto payment authorized");
        }}
      />
    </AccountLayout>
  );
}

function AutoPaymentSetupModal({ autoOrder, onClose, onSaved }) {
  const { showToast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [setupIntentId, setSetupIntentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!autoOrder) return;
    let active = true;
    setClientSecret("");
    setSetupIntentId("");
    setError("");
    setLoading(true);

    autoOrderApi
      .createPaymentSetupIntent(autoOrder.id)
      .then((data) => {
        if (!active) return;
        setClientSecret(data.clientSecret);
        setSetupIntentId(data.setupIntentId);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || "Could not start payment setup");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [autoOrder]);

  if (!autoOrder) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-[2px]">
      <div className="flex max-h-[88vh] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-[#17345f1a] bg-white shadow-[0_24px_70px_rgba(18,42,80,0.28)]">
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#17345f1a] px-5 py-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#122a50]">Setup auto payment</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
              Authorize a saved Stripe payment method for {autoOrder.productName || "this auto order"}.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-extrabold text-[#122a50] hover:bg-[#f8f1df]">
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-lg bg-[#f8f1df] p-3 text-sm font-semibold leading-6 text-[#122a50]">
            By continuing, you allow Best Vet Care to charge this card automatically for this auto order according to its selected frequency and current order total.
          </div>

          <div className="mt-4">
            {loading ? (
              <p className="text-sm font-semibold text-[#122a50b2]">Loading secure payment form...</p>
            ) : error ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p>
            ) : clientSecret ? (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    variables: {
                      borderRadius: "8px",
                      colorPrimary: "#17345f",
                    },
                  },
                }}
              >
                <SetupPaymentForm
                  autoOrderId={autoOrder.id}
                  setupIntentId={setupIntentId}
                  onSaved={onSaved}
                  onError={(message) => {
                    setError(message);
                    showToast(message, "error");
                  }}
                />
              </Elements>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupPaymentForm({ autoOrderId, setupIntentId, onSaved, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!stripe || !elements || !setupIntentId) return;
    setSaving(true);
    try {
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: `${window.location.origin}/account/auto-orders` },
        redirect: "if_required",
      });
      if (result.error) {
        throw new Error(result.error.message || "Payment setup failed");
      }
      const completedSetupIntentId = result.setupIntent?.id || setupIntentId;
      const updated = await autoOrderApi.savePaymentMethod(autoOrderId, completedSetupIntentId);
      onSaved(updated);
    } catch (err) {
      onError(err.message || "Payment setup failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PaymentElement />
      <div className="sticky bottom-0 -mx-5 mt-5 border-t border-[#17345f1a] bg-white px-5 py-4">
        <button
          type="button"
          onClick={submit}
          disabled={!stripe || !elements || saving}
          className="h-11 w-full rounded-lg bg-[#d9aa3d] px-5 text-sm font-extrabold text-[#17345f] transition-colors hover:bg-[#17345f] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Authorizing..." : "Authorize auto payment"}
        </button>
      </div>
    </div>
  );
}
