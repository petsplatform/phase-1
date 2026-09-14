import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import trustPets from "../../assets/images/trust-pets.png";

export default function EmptyCart() {
  return (
    <section className="grid min-h-[420px] place-items-center rounded-[18px] border border-borderSoft bg-white p-8 text-center shadow-[0_10px_28px_var(--color-shadow)]">
      <div>
        <img
          src={trustPets}
          alt="Dog and cat waiting beside an empty shopping cart"
          className="mx-auto h-40 w-64 object-contain"
          loading="lazy"
        />
        <h2 className="mt-5 font-display text-[36px] font-extrabold text-textMain">
          Your Cart is Empty
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-[15px] font-semibold text-muted">
          Looks like your furry friend is waiting for something special.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondaryDark px-7 text-[14px] font-extrabold text-white transition hover:scale-[1.02] hover:bg-primaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <ShoppingCart size={17} />
          Browse Products
        </Link>
      </div>
    </section>
  );
}
