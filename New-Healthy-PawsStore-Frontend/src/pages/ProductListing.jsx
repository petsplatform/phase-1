import { motion } from "framer-motion";
import {
  ChevronRight,
  Filter,
  Home as HomeIcon,
  PawPrint,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CategoryTabs from "../components/product-listing/CategoryTabs";
import FilterSidebar from "../components/product-listing/FilterSidebar";
import Pagination from "../components/product-listing/Pagination";
import ProductGrid from "../components/product-listing/ProductGrid";
import SortBar from "../components/product-listing/SortBar";
import TrustBar from "../components/product-listing/TrustBar";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import { catalogApi } from "../api/catalogApi";
import { useToast } from "../context/ToastContext";
import heroPets from "../assets/images/hero-pets-cutout.png";

const DEFAULT_FILTERS = {
  categoryId: "all",
  maxPrice: 200,
};

function slugToLabel(slug) {
  return slug.replace(/-/g, " ").toLowerCase();
}

function filterProducts(products, filters, categories, searchQuery) {
  const selectedCategory = categories.find(
    (category) => category.id === filters.categoryId,
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const searchText = [
      product.title,
      product.name,
      product.description,
      product.sku,
      product.category,
      product.category?.name,
      product.optionLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const searchMatches = !normalizedSearch || searchText.includes(normalizedSearch);

    const categoryName = String(product.category?.name || product.category || product.categoryName || "").toLowerCase();
    const targetFilter = String(filters.categoryId || "").toLowerCase();
    const categoryMatches =
      filters.categoryId === "all" ||
      !filters.categoryId ||
      product.categoryId === filters.categoryId ||
      (selectedCategory &&
        categoryName === selectedCategory.name.toLowerCase()) ||
      categoryName === targetFilter ||
      categoryName.includes(targetFilter) ||
      (!selectedCategory &&
        categoryName.includes(slugToLabel(filters.categoryId)));

    const priceMatches =
      filters.maxPrice >= 200 || Number(product.price || 0) <= filters.maxPrice;

    return (
      searchMatches &&
      categoryMatches &&
      priceMatches
    );
  });
}

function sortProducts(products, sort) {
  const sorted = [...products];

  if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
  if (sort === "name_asc")
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "rating_desc") sorted.sort((a, b) => b.rating - a.rating);

  return sorted;
}

export default function ProductListing() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "";
  const [view, setView] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      catalogApi.getProducts({ limit: 100 }),
      catalogApi.getCategories(),
    ])
      .then(([productsResult, categoriesResult]) => {
        if (!active) return;
        setProducts(productsResult.items || []);
        setCategories(categoriesResult || []);
        if (urlCategory) {
          setFilters((current) => ({ ...current, categoryId: urlCategory }));
        }
      })
      .catch((error) => {
        if (!active) return;
        setProducts([]);
        setCategories([]);
        showToast(error.message || "Could not load products.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast, urlCategory]);

  const filteredProducts = useMemo(
    () => sortProducts(filterProducts(products, filters, categories, searchQuery), sort),
    [products, filters, categories, searchQuery, sort],
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filters, sort, pageSize, searchQuery]);

  useEffect(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const handleCategoryChange = (categoryId) => {
    setFilters((current) => ({ ...current, categoryId }));
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", categoryId);
    }
    setSearchParams(nextParams, { replace: true });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="min-h-screen bg-softCream text-textMain">
      <Header />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="pb-10"
      >
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-[38px] lg:py-7">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-textMain sm:gap-3 sm:text-[13px]"
          >
            <a href="/" className="flex items-center gap-2">
              <HomeIcon size={15} />
              Home
            </a>
            <ChevronRight size={14} className="text-muted" />
            <a href="/products">Shop</a>
            <ChevronRight size={14} className="text-muted" />
            <span className="font-extrabold">Dog Food</span>
          </nav>

          <section className="relative mt-3 overflow-hidden rounded-[16px] border border-borderSoft bg-white p-4 shadow-[0_14px_42px_rgba(20,61,60,0.07)] sm:mt-5 sm:rounded-[18px] sm:p-7 lg:px-9">
            <div className="absolute right-0 top-0 hidden h-full w-[34%] bg-sageLight lg:block" style={{ borderBottomLeftRadius: 120 }} />
            <img
              src={heroPets}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-8 z-0 hidden h-[150px] max-w-none object-contain opacity-95 lg:block"
            />
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 max-w-[680px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-secondaryDark sm:px-3 sm:py-1 sm:text-[11px]">
                  <PawPrint size={12} fill="currentColor" />
                  Healthy pet essentials
                </span>
                <h1 className="mt-2 font-display text-[24px] font-extrabold leading-tight text-primaryDark sm:mt-3 sm:text-[36px] lg:text-[40px]">
                  {searchQuery ? `Search: ${searchQuery}` : "Dog Food"}
                </h1>
                <p className="mt-1.5 max-w-[560px] text-[13px] font-medium leading-relaxed text-muted sm:mt-3 sm:text-[15px]">
                  {searchQuery ? "Browse products matching your search." : "Find trusted food, medicine, treats and daily care products for every pet routine."}
                </p>
              </div>
              <div className="relative z-20 hidden lg:flex min-w-0 flex-col gap-3 lg:w-[280px] lg:flex-row lg:items-center lg:justify-end">
                <SortBar
                  view={view}
                  onViewChange={setView}
                  sort={sort}
                  onSortChange={setSort}
                />
              </div>
            </div>
          </section>

          {/* Mobile Toolbar: Sort Bar (Filter Button commented out as requested) */}
          <div className="mt-4 flex items-center gap-2.5 lg:hidden">
            {/*
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-borderSoft bg-white px-3 text-[13px] font-extrabold text-secondaryDark shadow-sm active:scale-[0.98] transition"
            >
              <Filter size={16} />
              Filters
            </button>
            */}
            <div className="flex-1">
              <SortBar
                view={view}
                onViewChange={setView}
                sort={sort}
                onSortChange={setSort}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-7 sm:mt-6">
            {/* Sidebar (Categories & Price Range) - Commented out as requested */}
            {/*
            <div className="hidden lg:block">
              <FilterSidebar
                categories={categories}
                filters={filters}
                onCategoryChange={handleCategoryChange}
                onMaxPriceChange={(maxPrice) =>
                  setFilters((current) => ({ ...current, maxPrice }))
                }
                onClear={clearFilters}
              />
            </div>
            */}
            <div
              ref={resultsRef}
              className="min-w-0 flex-1 w-full"
            >
              <CategoryTabs
                categories={categories}
                activeCategoryId={filters.categoryId}
                onCategoryChange={handleCategoryChange}
              />

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[13px] font-bold text-muted">
                <span>
                  Showing{" "}
                  {pageProducts.length ? (currentPage - 1) * pageSize + 1 : 0}
                  {" - "}
                  {Math.min(
                    currentPage * pageSize,
                    filteredProducts.length,
                  )} of {filteredProducts.length} products
                </span>
                {(filters.categoryId !== "all" ||
                  filters.maxPrice < 200 ||
                  searchQuery) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-secondaryDark underline underline-offset-4"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-5">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[365px] animate-pulse rounded-[16px] bg-sageLight"
                    />
                  ))}
                </div>
              ) : pageProducts.length ? (
                <>
                  <ProductGrid products={pageProducts} view={view} />
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                  />
                </>
              ) : (
                <div className="grid min-h-[320px] place-items-center rounded-[16px] border border-dashed border-borderSoft bg-white px-6 text-center">
                  <div>
                    <PawPrint
                      className="mx-auto text-sage"
                      size={42}
                      fill="currentColor"
                    />
                    <h2 className="mt-4 text-[22px] font-extrabold text-textMain">
                      No products found
                    </h2>
                    <p className="mt-2 text-[14px] font-semibold text-muted">
                      Try clearing filters or increasing the price range.
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-5 h-11 rounded-[10px] bg-secondaryDark px-6 text-[14px] font-extrabold text-white"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <TrustBar />
        </div>

        {filtersOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
          >
            <button
              type="button"
              className="absolute inset-0 bg-textMain/45"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,360px)] flex-col bg-white shadow-2xl">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-borderSoft px-5">
                <span className="inline-flex items-center gap-2 text-[16px] font-extrabold text-textMain">
                  <Filter size={18} className="text-secondaryDark" />
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="grid size-10 place-items-center rounded-lg bg-sageLight text-primary"
                  aria-label="Close filters"
                >
                  <X size={19} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <FilterSidebar
                  categories={categories}
                  filters={filters}
                  onCategoryChange={handleCategoryChange}
                  onMaxPriceChange={(maxPrice) =>
                    setFilters((current) => ({ ...current, maxPrice }))
                  }
                  onClear={clearFilters}
                />
              </div>
            </aside>
          </div>
        )}
      </motion.main>
      <Footer />
    </div>
  );
}
