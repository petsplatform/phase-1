/* eslint-disable react-hooks/set-state-in-effect */
import { useRef, useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../components/common/Footer";
import Header from "../components/common/Header";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import { productApi } from "../api/productApi";
import heroPets from "../assets/logo/dog.png";
import { mapCatalogProduct } from "../utils/catalog";

const categoryImages = {
  "Flea & Tick Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/1/5/2/22518-1-eng-GB/47f38817c5ce-400317_Bottle_Allermyl_250ml_face.png",
  Deworming: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/3/5/4/1/21453-1-eng-GB/d47952b77a35-Family-packshot_Endogard.jpg",
  "Skin & Coat Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/5/8/2/22857-1-eng-GB/63cf1d7c41ac-400523_Bottle_Pyoderm_250ml_face.png",
  "Ear Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/8/5/2/22588-1-eng-GB/7aa2cc3c683e-309712_Bottle_Epiotic_60ml_face.png",
  "Eye Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/8/5/2/22588-1-eng-GB/7aa2cc3c683e-309712_Bottle_Epiotic_60ml_face.png",
  "Dental Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/4/8/9/2/22984-1-eng-GB/f24ba0b83054-309623_Packshot_Enzymatic-Toothpaste_70g_face.png",
  "Digestive Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/2/6/1/1/21162-1-eng-GB/cc97e40e7fb8-Bag_HPM-G1_cat_face_Packaging-without-kg.jpg",
  "Joint & Mobility Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/0/1/8/4/144810-1-eng-GB/4ee68ffdff6c-309953_Packshot_Movoflex_S-x30_face.png",
  "Wound & First Aid": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/5/8/2/22857-1-eng-GB/63cf1d7c41ac-400523_Bottle_Pyoderm_250ml_face.png",
  "Allergy & Itch Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/1/5/2/22518-1-eng-GB/47f38817c5ce-400317_Bottle_Allermyl_250ml_face.png",
  "Calming & Anxiety Support": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/2/7/5/2/22572-1-eng-GB/564dfa3d2269-309359_Packshot_Zenidog_Collar-S-x1_face.png",
  "Vitamins & Supplements": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/6/7/2/22767-1-eng-GB/9e8d991077ea-307614_Box_Anxitane_S-x30tabs_face.png",
  "Probiotics & Gut Health": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/2/6/1/1/21162-1-eng-GB/cc97e40e7fb8-Bag_HPM-G1_cat_face_Packaging-without-kg.jpg",
  "Kidney & Urinary Care": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/6/9/6/2/22696-1-eng-GB/7ce39785fd91-308979_Packshot_Pronefra_60ml_face.png",
  "Liver Support": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/6/9/6/2/22696-1-eng-GB/7ce39785fd91-308979_Packshot_Pronefra_60ml_face.png",
  "Heart Support": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/0/1/8/4/144810-1-eng-GB/4ee68ffdff6c-309953_Packshot_Movoflex_S-x30_face.png",
  "Recovery & Nutrition": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/2/6/1/1/21162-1-eng-GB/cc97e40e7fb8-Bag_HPM-G1_cat_face_Packaging-without-kg.jpg",
  "Veterinary Diet": "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/0/5/6/1/21650-1-eng-GB/b7898a2c72e0-Bag_HPM-A2_cat_face_Packaging-without-kg.jpg",
};

const categories = Object.entries(categoryImages).map(([name, image]) => ({
  name,
  count: 0,
  image,
}));

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price Low to High", value: "price_asc" },
  { label: "Price High to Low", value: "price_desc" },
];

const petTypeOptions = ["Dog", "Cat", "Mouse", "Horse", "Bird", "Fish", "Rabbit", "Other"];

const FilterIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 6h16M7 12h10M10 18h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SortIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 4v14m0 0-3-3m3 3 3-3M17 20V6m0 0-3 3m3-3 3 3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CategorySlider = ({
  categories,
  categoryTerm,
  searchTerm,
}) => {
  const scrollerRef = useRef(null);
  const sliderCategories = [
    {
      name: "Shop All",
      count: 0,
      image: null,
      to: "/products",
    },
    ...categories.map((category) => ({
      ...category,
      to: `/products?category=${encodeURIComponent(category.name)}`,
    })),
  ];

  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;

    const checkOverflow = () => {
      setCanScroll(el.scrollWidth > el.clientWidth + 1);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);

    return () => observer.disconnect();
  }, [sliderCategories.length]);

  const scrollCategories = (direction) => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative mt-6">
      <div
        ref={scrollerRef}
        className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-1 pb-4 sm:gap-4"
      >
        {sliderCategories.map((category) => {
          const isShopAll = category.name === "Shop All";
          const isActive = isShopAll
            ? !searchTerm && !categoryTerm
            : categoryTerm === category.name;

          return (
            <Link
              key={category.name}
              to={category.to}
              className={`flex h-[86px] min-w-[188px] items-center justify-start gap-3 rounded-xl border px-4 text-left shadow-[0_6px_18px_rgba(18,42,80,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:shadow-[0_10px_24px_rgba(18,42,80,0.12)] sm:min-w-[202px] ${
                isActive
                  ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f] shadow-[0_10px_26px_rgba(217,170,61,0.18)]"
                  : "border-[#17345f1a] bg-white text-[#122a50]"
              }`}
            >
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_4px_12px_rgba(18,42,80,0.08)]">
                <img
                  src={category.image}
                  alt={`${category.name} products`}
                  className="h-full w-full scale-[1.8] object-contain mix-blend-multiply"
                  loading="lazy"
                />
              </span>
              <span className="line-clamp-3 text-[13px] font-extrabold leading-5">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
      {canScroll && (
        <>
          <button
            type="button"
            className="absolute left-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#17345f1a] bg-white text-[#122a50] shadow-md transition-all hover:border-[#d9aa3d] hover:text-[#d9aa3d] md:flex"
            onClick={() => scrollCategories("left")}
            aria-label="Scroll categories left"
          >
            <ChevronDownIcon className="h-5 w-5 rotate-90" />
          </button>
          <button
            type="button"
            className="absolute right-0 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#17345f1a] bg-white text-[#122a50] shadow-md transition-all hover:border-[#d9aa3d] hover:text-[#d9aa3d] md:flex"
            onClick={() => scrollCategories("right")}
            aria-label="Scroll categories right"
          >
            <ChevronDownIcon className="h-5 w-5 -rotate-90" />
          </button>
        </>
      )}
    </div>
  );
};

const normalizeApiProduct = (p) => {
  const normalized = mapCatalogProduct(p);

  return {
    ...normalized,
    id: normalized.id,
    slug: normalized.slug || normalized.id,
    name: normalized.name,
    description: normalized.description || "",
    image: normalized.image || normalized.optionVariants?.[0]?.image || normalized.optionVariants?.[0]?.mainImage || null,
    category: p.category?.name || p.category || "",
    brand: p.brand || "",
    petType: p.petType || "",
    optionType: p.optionType || "size",
    optionLabel: p.optionLabel || "Size",
    searchTerms: [p.category?.name, p.petType, p.description].filter(Boolean),
  };
};

const normalizeApiCategory = (category) => ({
  name: category.name,
  count: Number(category._count?.products ?? category.products ?? category.count ?? 0),
  image:
    categoryImages[category.name] ||
    category.image ||
    null,
});

const PAGE_SIZE = 20;

const ProductGridLoader = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {Array.from({ length: 10 }).map((_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-2xl border border-[#17345f12] bg-white shadow-[0_10px_26px_rgba(18,42,80,0.08)]"
      >
        <div className="aspect-square animate-pulse bg-[#f3ead8]" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-[#17345f14]" />
          <div className="h-3 w-full animate-pulse rounded-full bg-[#17345f10]" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#17345f10]" />
          <div className="flex items-end justify-between pt-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-[#d9aa3d33]" />
            <div className="h-9 w-9 animate-pulse rounded-lg bg-[#17345f14]" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ProductListing = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [apiProducts, setApiProducts] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [apiCategories, setApiCategories] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search")?.trim() || "";
  const categoryTerm = searchParams.get("category")?.trim() || "";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const sortValue = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const inStock = searchParams.get("inStock") || "";
  const petType = searchParams.get("petType") || "";

  const updateParams = (patch, { resetPage = true } = {}) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (resetPage) params.delete("page");
    setSearchParams(params);
  };

  useEffect(() => {
    setLoadingProducts(true);
    productApi
      .getProducts({
        q: searchTerm || undefined,
        category: categoryTerm || undefined,
        sort: sortValue,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        inStock: inStock || undefined,
        petType: petType || undefined,
        page,
        limit: PAGE_SIZE,
      })
      .then((data) => {
        setApiProducts((data?.items || []).map(normalizeApiProduct));
        setApiTotal(data?.total || 0);
        setApiTotalPages(data?.totalPages || 1);
      })
      .catch(() => {
        setApiProducts([]);
        setApiTotal(0);
        setApiTotalPages(1);
      })
      .finally(() => setLoadingProducts(false));
  }, [searchTerm, categoryTerm, sortValue, minPrice, maxPrice, inStock, petType, page]);

  useEffect(() => {
    productApi
      .getCategories()
      .then((data) => setApiCategories((data || []).map(normalizeApiCategory)))
      .catch(() => {});
  }, []);

  const goToPage = (nextPage) => {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const products = apiProducts || [];
  const total = apiTotal;
  const totalPages = apiTotalPages;
  const storefrontCategories = useMemo(
    () => (apiCategories.length > 0 ? apiCategories : categories),
    [apiCategories],
  );

  const pageNumbers = [];
  if (totalPages <= 7) {
    for (let n = 1; n <= totalPages; n += 1) pageNumbers.push(n);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("ellipsis-start");
    for (
      let n = Math.max(2, page - 1);
      n <= Math.min(totalPages - 1, page + 1);
      n += 1
    ) {
      pageNumbers.push(n);
    }
    if (page < totalPages - 2) pageNumbers.push("ellipsis-end");
    pageNumbers.push(totalPages);
  }

  const pageTitle = searchTerm
    ? `Search results for "${searchTerm}"`
    : categoryTerm || "Shop All Products";
  const pageSubtitle = searchTerm
    ? "Browse matching pet products from our trusted catalog."
    : categoryTerm
      ? `Browse our ${categoryTerm.toLowerCase()} products from trusted pet-care brands.`
      : "Browse every pet-care product from our trusted catalog.";

  return (
    <>
      <SEO
        title={`${pageTitle} | Best-Vet-Care Shop`}
        description={pageSubtitle}
        ogTitle={`${pageTitle} | Best-Vet-Care Shop`}
        ogDescription={pageSubtitle}
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />

        <main className="px-4 pb-6 pt-5 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1600px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#122a50]">
                {searchTerm ? "Search Results" : categoryTerm || "Shop All"}
              </span>
            </nav>

            <section className="mt-5 min-w-0">
              <div className="relative overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-[0_14px_42px_rgba(18,42,80,0.07)] sm:px-6 lg:px-8">
                <div
                  className="absolute right-0 top-0 hidden h-full w-[42%] bg-[#f8f1df] lg:block"
                  style={{ borderBottomLeftRadius: "120px" }}
                />
                <div className="absolute right-12 top-4 hidden h-24 w-24 rounded-full bg-[#d9aa3d]/15 lg:block" />
                <div className="relative flex min-h-[132px] flex-col justify-center gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <h1 className="text-[28px] font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                      {pageTitle}
                    </h1>
                    <p className="mt-2 text-sm font-semibold text-[#122a50b2]">
                      {pageSubtitle}
                    </p>
                  </div>

                  <div className="relative hidden h-[132px] w-[260px] flex-shrink-0 items-end justify-center lg:flex">
                    <img
                      src={heroPets}
                      alt="Dog and cat"
                      className="h-[156px] w-auto object-contain drop-shadow-[0_18px_26px_rgba(18,42,80,0.16)]"
                    />
                  </div>
                </div>
              </div>

              <CategorySlider
                categories={storefrontCategories}
                categoryTerm={categoryTerm}
                searchTerm={searchTerm}
              />

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {loadingProducts ? (
                    <span className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-[#17345f1a] bg-white px-3 text-xs font-extrabold text-[#122a50] shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading products
                    </span>
                  ) : (
                    <p className="text-xs font-semibold text-[#122a50b2] sm:text-sm">
                      Showing {total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}-
                      {Math.min(page * PAGE_SIZE, total)}{" "}
                      of {total} products
                    </p>
                  )}
                  <span className="inline-flex min-h-8 items-center rounded-lg border border-[#17345f1a] bg-white px-3 text-xs font-extrabold text-[#122a50] shadow-sm">
                    {searchTerm
                      ? `Search: ${searchTerm}`
                      : `Category: ${categoryTerm || "Shop All"}`}
                  </span>
                  {petType && (
                    <span className="inline-flex min-h-8 items-center rounded-lg border border-[#17345f1a] bg-white px-3 text-xs font-extrabold text-[#122a50] shadow-sm">
                      Pet: {petType}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#d9aa3d] text-white shadow-[0_8px_18px_rgba(217,170,61,0.28)] transition-colors hover:bg-[#17345f]"
                    onClick={() => setFiltersOpen(true)}
                    aria-label="Open filters"
                  >
                    <FilterIcon className="h-5 w-5" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#17345f1a] bg-white text-[#122a50] shadow-sm transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                      onClick={() => setSortOpen((value) => !value)}
                      aria-haspopup="listbox"
                      aria-expanded={sortOpen}
                      aria-label={`Sort products, current option ${
                        sortOptions.find((option) => option.value === sortValue)?.label || "Newest"
                      }`}
                    >
                      <SortIcon className="h-5 w-5" />
                    </button>

                    {sortOpen && (
                      <div className="absolute left-0 top-full z-30 mt-2 w-[220px] overflow-hidden rounded-xl border border-[#17345f1a] bg-white py-1 shadow-[0_14px_36px_rgba(18,42,80,0.16)] sm:left-auto sm:right-0">
                        <ul role="listbox" aria-label="Sort products">
                          {sortOptions.map((option) => (
                            <li key={option.value}>
                              <button
                                type="button"
                                className={`flex w-full px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                                  sortValue === option.value
                                    ? "bg-[#f8f1df] text-[#d9aa3d]"
                                    : "text-[#122a50] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                                }`}
                                onClick={() => {
                                  updateParams({ sort: option.value === "newest" ? "" : option.value });
                                  setSortOpen(false);
                                }}
                                role="option"
                                aria-selected={sortValue === option.value}
                              >
                                {option.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {loadingProducts ? (
                  <ProductGridLoader />
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id || product.name}
                        product={product}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#17345f1a] bg-white p-8 text-center">
                    <h2 className="text-xl font-extrabold text-[#122a50]">
                      No products found
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-[#122a50b2]">
                      Try searching for Dog Food, Pedigree, Royal Canin, toys,
                      or chicken.
                    </p>
                  </div>
                )}
              </div>

              {!loadingProducts && totalPages > 1 && (
                <nav
                  className="mt-6 flex items-center justify-center gap-2"
                  aria-label="Pagination"
                >
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[#122a50] hover:bg-[#f8f1df] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronDownIcon className="h-4 w-4 rotate-90" />
                  </button>

                  {pageNumbers.map((entry) =>
                    typeof entry === "number" ? (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => goToPage(entry)}
                        aria-current={entry === page ? "page" : undefined}
                        className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-extrabold ${
                          entry === page
                            ? "bg-[#17345f] text-white shadow-[0_8px_18px_rgba(18,42,80,0.22)]"
                            : "text-[#122a50] hover:bg-[#f8f1df]"
                        }`}
                      >
                        {entry}
                      </button>
                    ) : (
                      <span
                        key={entry}
                        className="flex h-9 w-9 items-center justify-center text-sm font-extrabold text-[#122a50b2]"
                      >
                        ...
                      </span>
                    ),
                  )}

                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[#122a50] hover:bg-[#f8f1df] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    aria-label="Next page"
                  >
                    <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                  </button>
                </nav>
              )}
            </section>
          </div>
        </main>

        <Footer />

        {filtersOpen && (
          <div className="fixed inset-0 z-[70]">
            <button
              type="button"
              className="absolute inset-0 bg-[#111111]/45"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filter drawer backdrop"
            />
            <div className="absolute inset-y-0 right-0 w-full overflow-y-auto bg-[#fffdf7] p-4 shadow-2xl transition-transform duration-300 sm:w-[420px]">
              <ProductFilters
                categories={storefrontCategories}
                petTypes={petTypeOptions}
                drawer
                activeCategory={categoryTerm}
                filters={{ minPrice, maxPrice, inStock, petType }}
                onApplyFilters={(next) => updateParams(next)}
                onResetFilters={() =>
                  updateParams({ minPrice: "", maxPrice: "", inStock: "", petType: "" })
                }
                onClose={() => setFiltersOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductListing;
