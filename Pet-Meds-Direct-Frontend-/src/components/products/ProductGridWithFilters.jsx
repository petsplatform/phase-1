import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, RotateCcw, ShieldAlert, SlidersHorizontal, ChevronDown, ListFilter, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { getProductsApi, getCategoriesApi, transformProduct } from "../../helper/axiosInstance";
import ProductCard from "./ProductCard";
import Pagination from "../common/Pagination";

const companionFilters = [
  { id: "dog", label: "Dog Care" },
  { id: "cat", label: "Cat Care" },
  { id: "bird", label: "Bird Care" },
  { id: "rabbit", label: "Rabbit Care" },
  { id: "fish", label: "Fish Care" }
];

export default function ProductGridWithFilters({ selectedCategoryId, setSelectedCategoryId }) {
  const [searchParams] = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      getProductsApi({ limit: 100 }),
      getCategoriesApi()
    ])
      .then(([productsRes, categoriesRes]) => {
        if (active) {
          const mappedProducts = (productsRes.data?.items || []).map(transformProduct);
          setProducts(mappedProducts);
          setCategories(categoriesRes.data || []);
        }
      })
      .catch((err) => {
        console.error("Error loading catalog data:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categoriesList = useMemo(() => {
    const list = [{ id: null, name: "All" }];
    if (categories.length === 0) {
      const fallbackNames = [
        "Dog Food & Nutrition",
        "Cat Food & Nutrition",
        "Pet Grooming",
        "Toys & Play",
        "Health & Wellness",
        "Collars, Leashes & Accessories"
      ];
      fallbackNames.forEach((name, index) => {
        list.push({ id: `fallback-${index}`, name });
      });
    } else {
      categories.forEach((c) => {
        list.push({ id: c.id, name: c.name });
      });
    }
    return list;
  }, [categories]);

  const currentSelectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    const norm = String(selectedCategoryId).trim().toLowerCase();
    const found = categoriesList.find(
      (c) =>
        String(c.id).toLowerCase() === norm ||
        String(c.name).toLowerCase() === norm,
    );
    return found || { id: selectedCategoryId, name: selectedCategoryId };
  }, [selectedCategoryId, categoriesList]);

  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 1);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
      
      const timer = setTimeout(checkScroll, 150);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
        clearTimeout(timer);
      };
    }
  }, []);

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 250;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "in-stock" | "offers"
  const [sortBy, setSortBy] = useState("recommended"); // "recommended" | "price-low-high" | "price-high-low"
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  // Advanced Filters State
  const [selectedCompanions, setSelectedCompanions] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Reset pagination when filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, searchQuery, statusFilter, sortBy, selectedCompanions, minPrice, maxPrice]);

  // Process filters and sorting in real-time
  const processedProducts = useMemo(() => {
    let items = products.filter((product) => {
      // 1. Category Filter
      if (
        currentSelectedCategory &&
        currentSelectedCategory.id !== null &&
        currentSelectedCategory.name !== "All"
      ) {
        const catTarget = String(currentSelectedCategory.name).trim().toLowerCase();
        const prodCat = String(product.category || "").trim().toLowerCase();
        if (
          prodCat !== catTarget &&
          !prodCat.includes(catTarget) &&
          !catTarget.includes(prodCat)
        ) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          product.name,
          product.description,
          product.category,
          product.productType,
          product.petType,
          ...(product.petCompanion || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const matchesName = searchableText.includes(query);
        if (!matchesName) {
          return false;
        }
      }

      // 3. Status Filter (Availability / Offers)
      if (statusFilter === "in-stock" && !product.inStock) {
        return false;
      }
      if (statusFilter === "offers" && !product.discount) {
        return false;
      }

      // 4. Pet Companion Filter (Checkboxes matching arrays or petType)
      if (selectedCompanions.length > 0) {
        const hasMatch =
          (product.petCompanion &&
            product.petCompanion.some((pc) => {
              const pcLower = String(pc).toLowerCase();
              return selectedCompanions.some(
                (sc) => pcLower.includes(sc.toLowerCase()) || sc.toLowerCase().includes(pcLower)
              );
            })) ||
          (product.petType &&
            selectedCompanions.some((sc) =>
              String(product.petType).toLowerCase().includes(sc.toLowerCase())
            ));
        if (!hasMatch) return false;
      }

      // 5. Price Limit Filter (Numerical limits)
      if (minPrice !== "") {
        const minVal = parseFloat(minPrice);
        if (!isNaN(minVal) && product.sellingPrice < minVal) {
          return false;
        }
      }
      if (maxPrice !== "") {
        const maxVal = parseFloat(maxPrice);
        if (!isNaN(maxVal) && product.sellingPrice > maxVal) {
          return false;
        }
      }

      return true;
    });

    // Sorting Logic
    if (sortBy === "price-low-high") {
      items.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === "price-high-low") {
      items.sort((a, b) => b.sellingPrice - a.sellingPrice);
    }

    return items;
  }, [currentSelectedCategory, products, searchQuery, statusFilter, sortBy, selectedCompanions, minPrice, maxPrice]);

  const handleCompanionChange = (companionId) => {
    if (selectedCompanions.includes(companionId)) {
      setSelectedCompanions(selectedCompanions.filter((id) => id !== companionId));
    } else {
      setSelectedCompanions([...selectedCompanions, companionId]);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("recommended");
    setSelectedCategoryId(null);
    setSelectedCompanions([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const handleCategoryClick = (catId) => {
    setSelectedCategoryId(catId);
  };

  const isDirty =
    selectedCategoryId ||
    searchQuery !== "" ||
    statusFilter !== "all" ||
    sortBy !== "recommended" ||
    selectedCompanions.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "";

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(processedProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedProducts, currentPage]);

  return (
    <section className="relative py-12 lg:py-16 bg-[#f8fafc]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        
        {/* ─── 1. SHOP BY CATEGORY SECTION (Commented out as requested) ─── */}
        {/*
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-4.5 w-1 rounded-full bg-primary-green inline-block" />
            <span className="text-xs font-black uppercase tracking-wider text-deep-navy/80">
              Shop By Category
            </span>
          </div>

          <div className="relative group">
            <div
              className={`absolute left-0 top-0 bottom-2 z-20 w-16 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/70 to-transparent flex items-center pointer-events-none transition-opacity duration-300 ${
                showLeftArrow ? "opacity-100" : "opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => scroll("left")}
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-deep-navy hover:bg-slate-50 hover:scale-105 transition-all cursor-pointer -translate-x-1"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
            </div>

            <div
              className={`absolute right-0 top-0 bottom-2 z-20 w-16 bg-gradient-to-l from-[#f8fafc] via-[#f8fafc]/70 to-transparent flex items-center justify-end pointer-events-none transition-opacity duration-300 ${
                showRightArrow ? "opacity-100" : "opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => scroll("right")}
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-deep-navy hover:bg-slate-50 hover:scale-105 transition-all cursor-pointer translate-x-1"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
            >
              {categoriesList.map((cat) => {
                const isAll = cat.id === null;
                const isActive = isAll
                  ? !selectedCategoryId
                  : selectedCategoryId === cat.id || selectedCategoryId === cat.name;
                return (
                  <button
                    key={cat.id || "All"}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all duration-300 cursor-pointer border shrink-0 ${
                      isActive
                        ? "bg-deep-navy border-deep-navy text-white shadow-md hover:opacity-90"
                        : "bg-white border-slate-200 text-deep-navy/70 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {isAll ? "All Products" : cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        */}


        {/* ─── 2. DYNAMIC TITLE & CONTROLS TOOLBAR ─── */}
        <div className="flex flex-col gap-6 mb-8 pb-6 border-b border-slate-200/60 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-deep-navy flex items-baseline gap-2">
              <span>{(currentSelectedCategory && currentSelectedCategory.id !== null) ? currentSelectedCategory.name : "All Products"}</span>
              <span className="text-xs font-bold text-deep-navy/40 uppercase tracking-wider font-sans">
                ({processedProducts.length} {processedProducts.length === 1 ? "Item" : "Items"} Total)
              </span>
            </h2>
          </div>

          {/* Toolbar Group */}
          <div className="flex flex-row items-center gap-2 w-full lg:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 sm:w-64 md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-deep-navy/40" />
              </div>
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full h-10 sm:h-11 pl-8.5 sm:pl-9.5 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-slate-200 rounded-xl bg-white text-xs sm:text-sm font-medium text-deep-navy placeholder:text-deep-navy/40 shadow-xs focus:outline-none focus:border-primary-green focus:ring-4 focus:ring-primary-green/5 transition-all"
              />
            </div>

            {/* Sort Dropdown (Mobile Icon view) */}
            <div className="relative flex sm:hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-deep-navy shadow-xs cursor-pointer hover:border-slate-300">
              <ArrowUpDown className="h-4 w-4 text-deep-navy/70" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>

            {/* Sort Dropdown (Desktop Dropdown view) */}
            <div className="relative hidden sm:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-deep-navy shadow-xs hover:border-slate-300 focus:outline-none focus:border-primary-green cursor-pointer"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown className="h-4 w-4 text-deep-navy/40" />
              </div>
            </div>

            {/* Expandable Filter Toggle Button (Commented out as requested) */}
            {/*
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:h-11 px-0 sm:px-4.5 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 cursor-pointer shrink-0 ${
                filtersOpen || statusFilter !== "all" || selectedCompanions.length > 0 || minPrice !== "" || maxPrice !== ""
                  ? "bg-primary-green/10 border-primary-green text-dark-green font-black"
                  : "bg-white border-slate-200 text-deep-navy hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            */}

            {/* Dynamic Reset Button */}
            {isDirty && (
              <button
                onClick={handleResetFilters}
                className="flex h-10 w-10 sm:w-auto sm:h-11 items-center justify-center gap-1.5 text-rose-500 hover:text-rose-600 border border-rose-500/10 hover:border-rose-500/20 bg-rose-500/5 px-0 sm:px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── 3. COLLAPSIBLE ADVANCED FILTER DRAWER (Commented out as requested) ─── */}
        {/*
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          filtersOpen ? "max-h-[1200px] opacity-100 mb-8" : "max-h-0 opacity-0 pointer-events-none mb-0"
        }`}>
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-soft grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0f2d52] mb-4 border-b border-slate-100 pb-2">
                Pet Companion
              </h3>
              <div className="flex flex-col gap-3.5">
                {companionFilters.map((filter) => (
                  <label
                    key={filter.id}
                    className="flex items-center gap-3 text-sm font-bold text-deep-navy/70 hover:text-deep-navy cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanions.includes(filter.id)}
                      onChange={() => handleCompanionChange(filter.id)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-primary-green focus:ring-primary-green/20"
                    />
                    <span>{filter.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0f2d52] mb-4 border-b border-slate-100 pb-2">
                Availability
              </h3>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Active Offers:
                </span>
                <div className="flex flex-col gap-1.5 p-1 bg-slate-50 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-deep-navy text-white shadow-xs"
                        : "text-deep-navy/60 hover:text-deep-navy hover:bg-slate-200/50"
                    }`}
                  >
                    All Meds
                  </button>
                  <button
                    onClick={() => setStatusFilter("in-stock")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                      statusFilter === "in-stock"
                        ? "bg-deep-navy text-white shadow-xs"
                        : "text-deep-navy/60 hover:text-deep-navy hover:bg-slate-200/50"
                    }`}
                  >
                    In Stock Only
                  </button>
                  <button
                    onClick={() => setStatusFilter("offers")}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                      statusFilter === "offers"
                        ? "bg-deep-navy text-white shadow-xs"
                        : "text-deep-navy/60 hover:text-deep-navy hover:bg-slate-200/50"
                    }`}
                  >
                    Special Offers
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
        */}

        {/* ─── 4. PRODUCTS DISPLAY GRID ─── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="flex flex-col w-full bg-white rounded-[2rem] border border-slate-100 p-3 h-[450px]"
              >
                <div className="w-full aspect-square bg-slate-100 rounded-[1.6rem] mb-4"></div>
                <div className="flex-1 px-3">
                  <div className="h-3.5 bg-slate-100 rounded w-1/4 mb-3"></div>
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-3"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <div className="h-6 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-10 bg-slate-100 rounded-xl w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedProducts.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {/* Reusable Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-16 px-4">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-5 text-rose-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="font-display font-black text-xl text-deep-navy mb-2">No Matching Products</h3>
            <p className="text-sm font-medium text-deep-navy/60 leading-relaxed mb-6">
              We couldn't find any medications matching your current search criteria, sorting selections, or filter settings. Try resetting.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-green hover:bg-dark-green text-white font-extrabold text-sm tracking-wider uppercase rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filters & Search</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
