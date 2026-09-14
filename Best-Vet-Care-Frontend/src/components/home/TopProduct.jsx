import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { mapCatalogProduct } from "../../utils/catalog";

function TopProduct() {
  const [categoryNames, setCategoryNames] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const loadCategoriesWithProducts = async () => {
      try {
        const data = await productApi.getCategories();
        const categories = Array.isArray(data) ? data : [];
        const eligible = await Promise.all(
          categories.map(async (category) => {
            const result = await productApi.getProducts({ category: category.name, limit: 100 });
            const count = Array.isArray(result?.items) ? result.items.length : 0;
            return count >= 3 ? category.name : null;
          }),
        );
        const names = eligible.filter(Boolean).slice(0, 6);
        if (!cancelled && names.length > 0) {
          setCategoryNames(names);
          setSelectedCategory(names[0]);
        }
      } catch {
        if (!cancelled) {
          setCategoryNames([]);
          setSelectedCategory("");
        }
      }
    };
    loadCategoriesWithProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      return;
    }
    productApi.getProducts({ category: selectedCategory, limit: 6 })
      .then((data) => {
        if (data?.items && data.items.length >= 3) {
            const mapped = data.items.map((p) => {
            const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
            const rawImage = p.image || p.mainImage ||
              (Array.isArray(p.optionVariants) && p.optionVariants[0]?.image) ||
              (Array.isArray(p.optionVariants) && p.optionVariants[0]?.mainImage) || null;
            const imageUrl = rawImage
              ? (rawImage.startsWith('http') ? rawImage : `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`)
              : null;

            const normalized = mapCatalogProduct(p);
            return {
              ...normalized,
              id: p.id,
              slug: p.id,
              name: p.name,
              description: p.description || "",
              image: imageUrl,
            };
          });
          
          setProducts(mapped);
        } else {
          setProducts([]);
        }
      })
      .catch(() => setProducts([]));
  }, [selectedCategory]);

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`${product.name} added to cart`);
  };

  return (
    <section className="w-full bg-background-secondary px-4 sm:px-5 lg:px-5 py-16 sm:py-18 md:py-20 mt-16 sm:mt-18 md:mt-20">
      <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-12 sm:gap-14 md:gap-16">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <h2
            className="text-[28px] sm:text-[36px] md:text-[40px] lg:text-[45px] font-semibold leading-tight"
            style={{ fontFamily: "Plus Jakarta Sans", fontWeight: "600", lineHeight: "1.27", color: "#122a50" }}
          >
            Find Your Perfect Pet Product
          </h2>
          <p
            className="text-sm sm:text-base max-w-md lg:max-w-lg"
            style={{ fontFamily: "Plus Jakarta Sans", fontSize: "16px", fontWeight: "400", lineHeight: "26px", color: "#122a50b2" }}
          >
            Browse our complete catalog and filter by pet type, routine, or care need.
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-row items-center gap-1.5 overflow-x-auto w-full scrollbar-hide">
            {categoryNames.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 px-6 sm:px-7 lg:px-[34px] py-3 rounded-4xl transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-button-bg-primary text-button-text-white"
                    : "bg-button-bg-white text-button-text-primary border border-border-light hover:bg-opacity-80"
                }`}
                style={{ borderRadius: "24px", fontFamily: "Plus Jakarta Sans", fontSize: "16px", fontWeight: "600", lineHeight: "21px" }}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {products.map((product) => (
              <div key={product.id} className="flex h-full flex-col gap-5 sm:gap-5.5">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-[280px] object-cover rounded-4xl"
                  style={{ borderRadius: "24px" }}
                />
                <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8 px-3.5 flex-1">
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                      <h3
                        className="text-lg sm:text-xl font-medium"
                        style={{ fontFamily: "Plus Jakarta Sans", fontSize: "20px", fontWeight: "500", lineHeight: "26px", color: "#122a50" }}
                      >
                        {product.name}
                      </h3>
                      <span className="flex flex-col sm:items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#122a5066]">
                          Selling Price
                        </span>
                        <span
                          className="text-lg sm:text-xl font-semibold"
                          style={{ fontFamily: "Plus Jakarta Sans", fontSize: "20px", fontWeight: "600", lineHeight: "26px", color: "#122a50" }}
                        >
                          ${product.price}
                        </span>
                      </span>
                    </div>
                    <p
                      className="line-clamp-2 min-h-[40px] overflow-hidden text-sm"
                      style={{ fontFamily: "Plus Jakarta Sans", fontSize: "14px", fontWeight: "400", lineHeight: "20px", color: "#122a50b2" }}
                    >
                      {product.description}
                    </p>
                  </div>
                  <div className="flex flex-row flex-wrap items-center gap-2">
                    <Link
                      to={`/product/${product.slug}`}
                      state={{ product }}
                      className="flex min-w-0 flex-1 items-center justify-center gap-2 px-5 sm:px-8 lg:px-[54px] py-3 bg-transparent border border-border-light rounded-4xl hover:bg-opacity-10 transition-all duration-200"
                      style={{ borderRadius: "24px", fontFamily: "Plus Jakarta Sans", fontSize: "16px", fontWeight: "600", lineHeight: "21px", color: "#122a50" }}
                    >
                      <span>View Product</span>
                      <img src="/images/img_arrow_right_black_900.svg" alt="" className="w-5 h-5" width={20} height={20} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center justify-center p-3.5 bg-button-bg-primary rounded-4xl hover:opacity-90 transition-all duration-200"
                      style={{ borderRadius: "24px" }}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <img src="/images/img_product_item_button.svg" alt="" className="w-[22px] h-[22px]" width={22} height={22} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TopProduct;
