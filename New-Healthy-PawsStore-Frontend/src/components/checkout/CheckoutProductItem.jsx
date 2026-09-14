export default function CheckoutProductItem({ item }) {
  return (
    <article className="grid grid-cols-[58px_1fr_auto] items-center gap-4 py-3">
      <img src={item.image} alt={item.title} className="h-[64px] w-[58px] object-contain" loading="lazy" />
      <div className="min-w-0">
        <h3 className="text-[13px] font-extrabold leading-snug text-textMain">{item.title}</h3>
        <p className="mt-1 text-[12px] font-semibold text-muted">
          {item.quantity} × ${item.price.toFixed(2)}
        </p>
      </div>
      <strong className="text-[14px] font-extrabold text-textMain">${(item.price * item.quantity).toFixed(2)}</strong>
    </article>
  );
}
