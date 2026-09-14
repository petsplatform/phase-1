export default function CheckoutSuccessModal({ orderId }) {
  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-primary/30 px-4">
      <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-contact">
        <h2 className="font-display text-[28px] font-extrabold text-textMain">Order Created</h2>
        <p className="mt-2 text-[14px] font-semibold text-muted">Your order ID is {orderId}.</p>
      </div>
    </div>
  );
}
