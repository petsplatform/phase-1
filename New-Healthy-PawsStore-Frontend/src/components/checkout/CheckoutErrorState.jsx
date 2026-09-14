import { Link } from "react-router-dom";

export default function CheckoutErrorState() {
  return (
    <section className="mx-auto max-w-[760px] rounded-2xl border border-borderSoft bg-white p-8 text-center shadow-contact">
      <h1 className="font-display text-[34px] font-extrabold text-textMain">Your cart is empty</h1>
      <p className="mt-2 text-[15px] font-semibold text-muted">Return to cart to add pet products before checkout.</p>
      <Link to="/cart" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-secondaryDark px-7 text-[14px] font-extrabold text-white">
        Return to Cart
      </Link>
    </section>
  );
}
