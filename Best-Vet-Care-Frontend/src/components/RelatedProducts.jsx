import ProductCard from "./ProductCard";

const SliderSection = ({ title, products }) => (
  <section className="mt-10">
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-2xl font-extrabold text-[#122a50]">{title}</h2>
      <button
        type="button"
        className="hidden text-sm font-extrabold text-[#d9aa3d] transition-colors hover:text-[#17345f] sm:inline-flex"
      >
        View all
      </button>
    </div>

    <div className="grid grid-flow-col auto-cols-[minmax(250px,1fr)] gap-4 overflow-x-auto pb-2 sm:auto-cols-[calc(50%-0.5rem)] xl:grid-flow-row xl:grid-cols-4 xl:overflow-visible xl:pb-0">
      {products.map((product) => (
        <ProductCard key={`${title}-${product.name}`} product={product} />
      ))}
    </div>
  </section>
);

const RelatedProducts = ({ relatedProducts, recentlyViewed }) => {
  return (
    <>
      <SliderSection title="Related Products" products={relatedProducts} />
      <SliderSection title="Recently Viewed Products" products={recentlyViewed} />
    </>
  );
};

export default RelatedProducts;
