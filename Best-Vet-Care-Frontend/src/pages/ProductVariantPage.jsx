import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { buildDemoFamilyVariants, getFamilyVariants, mapCatalogProduct } from "../utils/catalog";
import { formatImageUrl, ProductSupportTabs, ProductVariantDetails, RatingLine, VariantPurchaseCard } from "../components/ProductFamilySections";

const ProductVariantPage = () => {
  const { productSlug, variantSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    productApi
      .getProductById(productSlug)
      .then((product) => {
        const mappedProduct = { ...product, ...mapCatalogProduct(product) };
        const variants = getFamilyVariants(mappedProduct);
        const fallbackVariants = variants.length ? variants : buildDemoFamilyVariants(mappedProduct);
        const variant = fallbackVariants.find(
          (item) => item.slug === variantSlug || item.id === variantSlug,
        );
        if (isMounted) setData(variant ? { product: mappedProduct, variant } : null);
      })
      .catch(() =>
        productApi
          .getProductVariant(productSlug, variantSlug)
          .then((response) => {
            if (isMounted) setData(response);
          })
          .catch(() => {
            if (isMounted) setData(null);
          }),
      )
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [productSlug, variantSlug]);

  useEffect(() => {
    const targetId = data?.product?.id || data?.product?._id || productSlug;
    if (!targetId) return;
    reviewApi
      .getProductReviews(targetId)
      .then((items) => setReviews(Array.isArray(items) ? items : []))
      .catch(() => setReviews([]));
  }, [data?.product?.id, data?.product?._id, productSlug]);

  const product = data?.product;
  const variant = data?.variant;
  const images = useMemo(() => {
    const candidates = [
      variant?.image,
      ...(Array.isArray(variant?.gallery) ? variant.gallery : []),
      ...(Array.isArray(variant?.skus) ? variant.skus.map((sku) => sku.image) : []),
    ];
    return [...new Set(candidates.map(formatImageUrl).filter(Boolean))];
  }, [product, variant]);

  useEffect(() => {
    setSelectedImage(images[0] || null);
  }, [images]);

  const image = selectedImage || images[0] || "/images/img_product_item_image.png";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#d9aa3d]" /></main>
        <Footer />
      </div>
    );
  }

  if (!product || !variant) {
    return (
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="mx-auto max-w-[900px] px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold">Variant Not Found</h1>
          <Link to="/products" className="mt-4 inline-flex text-sm font-extrabold text-[#d9aa3d]">Return to products</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEO title={`${variant.seoTitle || variant.name} | Best-Vet-Care`} description={variant.seoDescription || variant.shortDescription || product.description} />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="px-4 pb-8 pt-5 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1440px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="hover:text-[#d9aa3d]">Home</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <Link to={`/products/${product.slug || product.id}`} className="hover:text-[#d9aa3d]">{product.name}</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <span className="font-extrabold text-[#122a50]">{variant.name}</span>
            </nav>

            <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(260px,42%)_minmax(0,1fr)] lg:items-start">
              <div className="rounded-2xl border border-[#17345f12] bg-white p-5 shadow-sm">
                <div className="flex aspect-square items-center justify-center rounded-xl bg-[#fffdf7] p-4">
                  <img src={image} alt={variant.name} className="h-full w-full object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2" aria-label="Variant images">
                    {images.map((imageUrl, index) => (
                      <button
                        key={`${imageUrl}-${index}`}
                        type="button"
                        onClick={() => setSelectedImage(imageUrl)}
                        className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-[#fffdf7] p-1 ${
                          image === imageUrl ? "border-[#d9aa3d]" : "border-[#17345f12]"
                        }`}
                        aria-label={`View variant image ${index + 1}`}
                      >
                        <img src={imageUrl} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-[#17345f12] bg-white p-5 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#d9aa3d]">{product.name}</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-normal text-[#122a50]">{variant.displayName || variant.name}</h1>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold text-[#17345f]">
                  {variant.strength && <span className="rounded-full bg-[#f8f1df] px-3 py-1">{variant.strength}</span>}
                  {variant.weightRange && <span className="rounded-full bg-[#f8f1df] px-3 py-1">{variant.weightRange}</span>}
                  {variant.packColor && <span className="rounded-full bg-[#f8f1df] px-3 py-1">{variant.packColor}</span>}
                </div>
                <div className="mt-4"><RatingLine rating={product.averageRating} count={product.reviewCount} /></div>
                {variant.shortDescription && <p className="mt-4 text-sm font-semibold leading-7 text-[#122a50b2]">{variant.shortDescription}</p>}
                <div className="mt-5">
                  <VariantPurchaseCard product={product} variant={variant} />
                </div>
              </div>
            </section>

            <ProductSupportTabs
              product={product}
              reviews={reviews}
              detailsContent={<ProductVariantDetails product={product} variants={[variant]} selectedVariant={variant} embedded />}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ProductVariantPage;
