import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import OrderTimeline from "../../components/account/OrderTimeline";
import OrderTrackingForm from "../../components/account/OrderTrackingForm";
import TrackingOrderDetails from "../../components/account/TrackingOrderDetails";
import { trackOrder } from "../../services/orderService";

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const prefillId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async ({ query }) => {
    if (!query || !query.trim()) return;
    setLoading(true);
    setError("");
    try {
      setOrder(await trackOrder(query));
    } catch (nextError) {
      setOrder(null);
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prefillId) {
      handleTrack({ query: prefillId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillId]);

  return (
    <section>
      <h1 className="font-display text-[34px] font-extrabold text-textMain">Track Your Order</h1>
      <p className="mt-1 text-[14px] font-semibold text-muted">Enter your order ID to check real-time status</p>
      <OrderTrackingForm onTrack={handleTrack} loading={loading} defaultQuery={prefillId} />
      {error && <p className="mt-4 rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">{error}</p>}
      {order && (
        <>
          <TrackingOrderDetails order={order} />
          <OrderTimeline
            currentStatus={order.status}
            orderDate={order.date}
            estimatedDelivery={order.estimatedDelivery}
          />
        </>
      )}
    </section>
  );
}
