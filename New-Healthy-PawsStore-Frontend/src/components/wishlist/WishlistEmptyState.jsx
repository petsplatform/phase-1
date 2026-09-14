import { Heart, PawPrint } from "lucide-react";
import { Link } from "react-router-dom";
import heroPets from "../../assets/images/wishlist/wishlist-dog-cat.png";

export default function WishlistEmptyState() {
  return (
    <section className="grid min-h-[420px] place-items-center rounded-[18px] border border-borderSoft bg-white p-8 text-center shadow-[0_10px_28px_var(--color-shadow)]">
      <div>
        <div className="relative mx-auto h-40 w-64">
          <img
            src={heroPets}
            alt="Dog and cat waiting for wishlist products"
            className="h-full w-full object-contain"
            loading="lazy"
          />
          <Heart
            className="absolute right-4 top-2 text-secondaryDark"
            size={36}
            strokeWidth={1.7}
          />
        </div>
        <h2 className="mt-5 font-display text-[34px] font-extrabold text-textMain">
          Your wishlist is waiting
        </h2>
        <p className="mx-auto mt-2 max-w-[420px] text-[15px] font-semibold text-muted">
          Save favorite food, treats, toys, and care products here so they are
          ready when your pets need them.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondaryDark px-7 text-[14px] font-extrabold text-white transition hover:scale-[1.02] hover:bg-primaryDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <PawPrint size={17} fill="currentColor" />
          Browse Products
        </Link>
      </div>
    </section>
  );
}
