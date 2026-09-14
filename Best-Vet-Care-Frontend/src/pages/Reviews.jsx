import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Star } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import ProductCard from "../components/ProductCard";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { productApi } from "../api/productApi";

const getReviewCount = (product) =>
  Number(
    product.reviewsCount ||
      product.ratingCount ||
      (Array.isArray(product.reviews) ? product.reviews.length : product.reviews) ||
      0,
  );

const Reviews = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    productApi
      .getProducts({ limit: 20, sort: "rating" })
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        if (active) setProducts(items);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const reviewedProducts = useMemo(
    () => products.filter((product) => getReviewCount(product) > 0),
    [products],
  );

  return (
    <>
      <SEO
        title="Reviews | Best Vet Care"
        description="Browse Best Vet Care products with customer review activity."
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1320px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <span className="font-extrabold text-[#122a50]">Reviews</span>
            </nav>

            <section className="mt-5 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8">
              <div className="flex max-w-3xl items-center gap-4">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
                  <Star className="h-7 w-7 fill-current" />
                </span>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                    Customer Reviews
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                    Review data comes from product reviews submitted after orders. Open a product to read its full review tab.
                  </p>
                </div>
              </div>
            </section>

            {loading ? (
              <p className="mt-6 flex items-center gap-2 rounded-2xl border border-[#17345f1a] bg-white p-5 text-sm font-semibold text-[#122a50b2] shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#d9aa3d]" />
                Loading reviewed products...
              </p>
            ) : reviewedProducts.length ? (
              <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {reviewedProducts.map((product) => (
                  <ProductCard key={product.id || product._id || product.slug} product={product} />
                ))}
              </section>
            ) : (
              <section className="mt-6 rounded-2xl border border-[#17345f1a] bg-white p-6 text-center shadow-sm">
                <h2 className="text-xl font-extrabold text-[#122a50]">No public product reviews yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#122a50b2]">
                  Delivered orders can submit product reviews from My Orders.
                </p>
                <Link to="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]">
                  Browse Products
                </Link>
              </section>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Reviews;
