import { useEffect, useState } from "react";
import { productApi } from "../../api/productApi";
import ShopProductCard from "../Shop/ShopProductCard";
import { ProductCardSkeleton } from "../common/ProductCardSkeleton";

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl">
      <span className="section-kicker">{eyebrow}</span>
      <h2 className="mt-5 font-sans text-2xl leading-[1] text-on-background sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-2xl text-sm leading-7 text-charcoal-text sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ProductSection({ onAddToCart, wishlistIds = [], onToggleWishlist }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    productApi
      .getProducts({ limit: 8 })
      .then((data) => {
        if (!isMounted) return;
        const apiProducts = Array.isArray(data.items) ? data.items : [];
        setProducts(apiProducts);
      })
      .catch((error) => {
        console.error("Failed to load store best sellers:", error);
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="border-b border-outline bg-white" id="best-sellers">
      <div className="page-shell px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Best Sellers"
          title="Loved by pets, trusted by owners."
        />

        <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : (
            products.map((product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                isWished={
                  wishlistIds.map(String).includes(String(product.id)) ||
                  (product.productId && wishlistIds.map(String).includes(String(product.productId)))
                }
                onToggleWishlist={onToggleWishlist}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductSection;
