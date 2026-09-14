import ProductCard from "./ProductCard";

export default function ProductGrid({ products, view = "grid" }) {
  return (
    <div className={view === "grid" ? "grid auto-rows-fr grid-cols-2 items-stretch gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:gap-5" : "grid grid-cols-1 gap-4"}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} view={view} />
      ))}
    </div>
  );
}
