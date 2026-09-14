import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { buildDemoFamilyVariants, getFamilyVariants, mapCatalogProduct, normalizeArrayField } from "../utils/catalog";
import { formatImageUrl, money, ProductSupportTabs, ProductVariantDetails, RatingLine, VariantPurchaseCard } from "../components/ProductFamilySections";

const prepareProduct = (data) => ({ ...data, ...mapCatalogProduct(data) });

const ProductFamilyPage = () => {
  const { productSlug } = useParams();
  const location = useLocation();
  const clickedProduct = location.state?.product;
  const [product, setProduct] = useState(() => (clickedProduct ? prepareProduct(clickedProduct) : null));
  const [loading, setLoading] = useState(!clickedProduct);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (clickedProduct) {
      setProduct(prepareProduct(clickedProduct));
    }
    setLoading(!clickedProduct);
    productApi
      .getProductById(productSlug)
      .then((data) => {
        if (!isMounted) return;
        setProduct(prepareProduct(data));
      })
      .catch(() => {
        if (isMounted && !clickedProduct) setProduct(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [productSlug]);

  useEffect(() => {
    const targetId = product?.id || product?._id || productSlug;
    if (!targetId) return;
    reviewApi
      .getProductReviews(targetId)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, [product?.id, product?._id, productSlug]);

  const activeVariants = useMemo(
    () => {
      const savedVariants = getFamilyVariants(product || {}).filter((variant) => variant.status !== "Inactive");
      return savedVariants.length > 0 ? savedVariants : buildDemoFamilyVariants(product || {});
    },
    [product],
  );
  const isFamilyProduct = product?.productType === "FAMILY" || activeVariants.length > 0;
  const hasMultipleFlatVariants = normalizeArrayField(product?.optionVariants).length > 1;
  const image = formatImageUrl(product?.image) || "/images/img_product_item_image.png";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="flex min-h-[55vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#d9aa3d]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="mx-auto max-w-[900px] px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold">Product Not Found</h1>
          <Link to="/products" className="mt-4 inline-flex text-sm font-extrabold text-[#d9aa3d]">Return to products</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isFamilyProduct && !hasMultipleFlatVariants) {
    return <Navigate to={`/product/${product.slug || product.id}`} replace />;
  }

  return (
    <>
      <SEO title={`${product.seoTitle || product.name} | Best-Vet-Care`} description={product.seoDescription || product.description} />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="px-4 pb-8 pt-5 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1440px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="hover:text-[#d9aa3d]">Home</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <Link to="/products" className="hover:text-[#d9aa3d]">{product.category?.name || product.category || "Products"}</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <span className="font-extrabold text-[#122a50]">{product.name}</span>
            </nav>

            <section className="mt-5 grid gap-6 rounded-2xl border border-[#17345f12] bg-white p-5 shadow-sm lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="flex aspect-square items-center justify-center rounded-xl bg-[#fffdf7] p-4">
                <img src={image} alt={product.name} className="h-full w-full object-contain" />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#d9aa3d]">{product.brand || "Best-Vet-Care"}</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">{product.name}</h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#122a50b2]">{product.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <RatingLine rating={product.averageRating} count={product.reviewCount} />
                  <span className="rounded-full bg-[#f8f1df] px-3 py-1 text-xs font-extrabold text-[#17345f]">
                    {activeVariants.length} variants available
                  </span>
                  <span className="rounded-full bg-[#17345f] px-3 py-1 text-xs font-extrabold text-white">
                    Starting from {money(product.minVariantPrice || product.price)}
                  </span>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-2">
              {activeVariants.length ? (
                activeVariants.map((variant) => (
                  <VariantPurchaseCard key={variant.id} product={product} variant={variant} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#17345f1a] bg-white p-8 text-center">
                  <h2 className="text-xl font-extrabold">No active variants available</h2>
                </div>
              )}
            </section>

            <ProductSupportTabs
              product={product}
              reviews={reviews}
              detailsContent={<ProductVariantDetails product={product} variants={activeVariants} embedded />}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ProductFamilyPage;
