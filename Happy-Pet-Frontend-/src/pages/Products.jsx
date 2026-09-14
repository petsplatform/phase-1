import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import ProductCard from "../components/product/ProductCard.jsx";
import CouponOffers from "../components/coupons/CouponOffers.jsx";
import { productApi } from "../api/productApi";
import { useCart } from "../utils/cartFunctionality.js";
import { useWishlist } from "../utils/wishlistFunctionality.js";
import { Link, useSearchParams } from "react-router-dom";
import { slugToCategory } from "../utils/product/categories.js";

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Fish"];
const FOOD_TYPES = ["Dry Food", "Wet Food", "Treats", "Medicine"];
const ALL_CATEGORY = { id: "", name: "All Products" };
const PRODUCTS_PER_PAGE = 12;

function normalizeCatalogCategory(category = {}) {
  return {
    id: String(category.id || ""),
    name: category.name || "Untitled Category",
    productCount: category._count?.products || category.productCount || 0,
  };
}

function slugifyCategory(label) {
  return String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Products() {
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam =
    searchParams.get("search") ||
    searchParams.get("petType") ||
    searchParams.get("q") ||
    "";
  const categoryParam = searchParams.get("category") || "";
  const pageParam = Number(searchParams.get("page") || 1);
  const currentPage =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  // Primary filter states — initialise category from URL slug on first render
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return categoryParam ? decodeURIComponent(categoryParam) : "All Products";
  });
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [sortBy, setSortBy] = useState("default");

  const categoryOptions = useMemo(
    () => [ALL_CATEGORY, ...apiCategories],
    [apiCategories],
  );

  const getCategoryFromParam = useCallback(
    (param) => {
      if (!param) return "All Products";
      const cleanParam = decodeURIComponent(String(param)).trim();
      const normalizedParam = cleanParam.toLowerCase();
      const matchedCategory = apiCategories.find((category) => {
        const id = String(category.id || "").toLowerCase();
        const name = String(category.name || "").toLowerCase();
        const slug = slugifyCategory(category.name);
        return (
          id === normalizedParam ||
          name === normalizedParam ||
          slug === normalizedParam
        );
      });
      if (matchedCategory?.name) return matchedCategory.name;
      const fromSlug = slugToCategory(cleanParam);
      if (fromSlug && fromSlug !== "All Products") return fromSlug;
      return cleanParam;
    },
    [apiCategories],
  );

  // When URL ?category= changes (e.g. browser back/forward), sync state
  useEffect(() => {
    setSelectedCategory(getCategoryFromParam(categoryParam));
  }, [categoryParam, getCategoryFromParam]);

  // When URL ?q= changes, sync search query state
  useEffect(() => {
    queueMicrotask(() => {
      setSearchQuery(queryParam);
    });
  }, [queryParam]);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setApiError(null);
      const [data, categories] = await Promise.all([
        productApi.getProducts({ limit: 100 }),
        productApi.getCategories(),
      ]);
      setProducts(Array.isArray(data?.items) ? data.items : []);
      setApiCategories((categories || []).map(normalizeCatalogCategory));
    } catch (error) {
      console.error("Failed to load STORE_5 products", error);
      setProducts([]);
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load products. Please try again.",
      );
      toast.error("Live catalog unavailable. Please try again.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        setIsLoadingProducts(true);
        setApiError(null);
        const [data, categories] = await Promise.all([
          productApi.getProducts({ limit: 100 }),
          productApi.getCategories(),
        ]);
        if (!cancelled) {
          setProducts(Array.isArray(data?.items) ? data.items : []);
          setApiCategories((categories || []).map(normalizeCatalogCategory));
        }
      } catch (error) {
        console.error("Failed to load STORE_5 products", error);
        if (!cancelled) {
          setProducts([]);
          setApiError(
            error.response?.data?.message ||
              error.message ||
              "Failed to load products. Please try again.",
          );
          toast.error("Live catalog unavailable. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Change category and reflect it in the URL slug */
  const handleCategoryChange = (category) => {
    const label = typeof category === "string" ? category : category.name;
    setSelectedCategory(label);
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (label === "All Products") {
      next.delete("category");
    } else {
      next.set(
        "category",
        typeof category === "string" ? slugifyCategory(label) : category.id,
      );
    }
    setSearchParams(next, { replace: true });
  };

  const handleSearchQueryChange = (val) => {
    setSearchQuery(val);
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (val && val.trim()) {
      next.set("search", val.trim());
      next.delete("q");
    } else {
      next.delete("search");
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  // Drawer/Sidebar filter states
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);
  const [selectedPetTypes, setSelectedPetTypes] = useState([]);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(100);

  // Mobile drawer open state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sidebar collapsible sections
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [availabilityOpen, setAvailabilityOpen] = useState(true);
  const [petTypeOpen, setPetTypeOpen] = useState(true);
  const [foodTypeOpen, setFoodTypeOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  // Category carousel ref + scroll state
  const categoryScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  const scrollCategories = (dir) => {
    const el = categoryScrollRef.current;
    if (el) el.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  // Auto-scroll selected pill into view when category changes
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const selected = el.querySelector("[data-selected='true']");
    if (selected)
      selected.scrollIntoView({
        inline: "nearest",
        behavior: "smooth",
        block: "nearest",
      });
  }, [selectedCategory]);

  // Filtering calculation logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Category Filter
    if (selectedCategory !== "All Products") {
      const cat = selectedCategory.toLowerCase();
      if (cat === "dogs") {
        result = result.filter((p) => {
          const petType = String(p.petType || p.pet_type || "").toLowerCase().trim();
          if (petType) {
            return (
              petType.includes("dog") ||
              petType === "all" ||
              petType === "all pets" ||
              petType === "both"
            );
          }
          return (
            p.name.toLowerCase().includes("dog") ||
            p.categoryName.toLowerCase().includes("dog")
          );
        });
      } else if (cat === "cats") {
        result = result.filter((p) => {
          const petType = String(p.petType || p.pet_type || "").toLowerCase().trim();
          if (petType) {
            return (
              petType.includes("cat") ||
              petType === "all" ||
              petType === "all pets" ||
              petType === "both"
            );
          }
          return (
            p.name.toLowerCase().includes("cat") ||
            p.categoryName.toLowerCase().includes("cat")
          );
        });
      } else {
        result = result.filter((p) => {
          const pCat = String(p.categoryName || p.category?.name || p.category || "").toLowerCase().trim();
          return pCat === cat || pCat.includes(cat) || cat.includes(pCat);
        });
      }
    }

    // 2. Search / Pet Type / Category query filter
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      if (q === "dog" || q === "dogs") {
        result = result.filter((p) => {
          const petType = String(p.petType || p.pet_type || "").toLowerCase().trim();
          if (petType) {
            return (
              petType.includes("dog") ||
              petType === "all" ||
              petType === "all pets" ||
              petType === "both"
            );
          }
          const pName = String(p.name || "").toLowerCase();
          const pCat = String(p.categoryName || "").toLowerCase();
          return pName.includes("dog") || pCat.includes("dog");
        });
      } else if (q === "cat" || q === "cats") {
        result = result.filter((p) => {
          const petType = String(p.petType || p.pet_type || "").toLowerCase().trim();
          if (petType) {
            return (
              petType.includes("cat") ||
              petType === "all" ||
              petType === "all pets" ||
              petType === "both"
            );
          }
          const pName = String(p.name || "").toLowerCase();
          const pCat = String(p.categoryName || "").toLowerCase();
          return pName.includes("cat") || pCat.includes("cat");
        });
      } else if (q === "medicine" || q === "medicines" || q === "pet medicines") {
        result = result.filter((p) => {
          const pName = String(p.name || "").toLowerCase();
          const pCat = String(p.categoryName || "").toLowerCase();
          const pDesc = String(p.description || "").toLowerCase();
          const isRx = Boolean(p.prescriptionRequired || p.isPrescriptionRequired);
          return (
            isRx ||
            pCat.includes("med") ||
            pCat.includes("health") ||
            pCat.includes("rx") ||
            pCat.includes("pharm") ||
            pCat.includes("treatment") ||
            pName.includes("med") ||
            pName.includes("tablet") ||
            pName.includes("capsule") ||
            pName.includes("rx") ||
            pName.includes("pill") ||
            pName.includes("chew") ||
            pDesc.includes("medicine") ||
            pDesc.includes("treatment") ||
            pDesc.includes("prescription") ||
            pDesc.includes("dosage")
          );
        });
      } else if (q === "food") {
        result = result.filter((p) => {
          const pName = String(p.name || "").toLowerCase();
          const pCat = String(p.categoryName || "").toLowerCase();
          const pDesc = String(p.description || "").toLowerCase();
          return (
            pCat.includes("food") ||
            pCat.includes("diet") ||
            pCat.includes("treat") ||
            pCat.includes("feed") ||
            pName.includes("food") ||
            pName.includes("diet") ||
            pName.includes("kibble") ||
            pName.includes("treat") ||
            pDesc.includes("food") ||
            pDesc.includes("diet") ||
            pDesc.includes("nutrition")
          );
        });
      } else if (q === "grooming") {
        result = result.filter((p) => {
          const pName = String(p.name || "").toLowerCase();
          const pCat = String(p.categoryName || "").toLowerCase();
          const pDesc = String(p.description || "").toLowerCase();
          return (
            pCat.includes("groom") ||
            pCat.includes("shampoo") ||
            pCat.includes("coat") ||
            pCat.includes("bath") ||
            pName.includes("groom") ||
            pName.includes("shampoo") ||
            pName.includes("brush") ||
            pName.includes("wash") ||
            pName.includes("soap") ||
            pDesc.includes("groom") ||
            pDesc.includes("shampoo") ||
            pDesc.includes("bath")
          );
        });
      } else if (q === "supplements" || q === "supplement") {
        result = result.filter((p) => {
          const pName = String(p.name || "").toLowerCase();
          const pCat = String(p.categoryName || "").toLowerCase();
          const pDesc = String(p.description || "").toLowerCase();
          return (
            pCat.includes("supplement") ||
            pCat.includes("vitamin") ||
            pCat.includes("wellness") ||
            pName.includes("supplement") ||
            pName.includes("vitamin") ||
            pName.includes("omega") ||
            pName.includes("calcium") ||
            pName.includes("joint") ||
            pDesc.includes("supplement") ||
            pDesc.includes("vitamin") ||
            pDesc.includes("nutrient")
          );
        });
      } else {
        // Generic search match
        result = result.filter((p) => {
          const petType = String(p.petType || "").toLowerCase();
          const pName = String(p.name || "").toLowerCase();
          const pCat = String(p.categoryName || "").toLowerCase();
          const pDesc = String(p.description || "").toLowerCase();
          const pBrand = String(p.brand || "").toLowerCase();
          return (
            petType.includes(q) ||
            pName.includes(q) ||
            pCat.includes(q) ||
            pDesc.includes(q) ||
            pBrand.includes(q)
          );
        });
      }
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    pageStartIndex,
    pageStartIndex + PRODUCTS_PER_PAGE,
  );
  const firstVisibleProduct = filteredProducts.length ? pageStartIndex + 1 : 0;
  const lastVisibleProduct = Math.min(
    pageStartIndex + paginatedProducts.length,
    filteredProducts.length,
  );
  const shouldShowPagination = filteredProducts.length > PRODUCTS_PER_PAGE;

  useEffect(() => {
    if (currentPage === safeCurrentPage) return;
    const next = new URLSearchParams(searchParams);
    if (safeCurrentPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(safeCurrentPage));
    }
    setSearchParams(next, { replace: true });
  }, [currentPage, safeCurrentPage, searchParams, setSearchParams]);

  const setCurrentPage = (page) => {
    const nextPage = Math.min(Math.max(1, page), totalPages);
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handlePetTypeToggle = (pet) => {
    setSelectedPetTypes((prev) =>
      prev.includes(pet) ? prev.filter((p) => p !== pet) : [...prev, pet],
    );
  };

  const handleFoodTypeToggle = (food) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(food) ? prev.filter((f) => f !== food) : [...prev, food],
    );
  };

  const handleResetFilters = () => {
    setSelectedCategory("All Products");
    setSearchQuery("");
    setSearchParams({}, { replace: true });
    setSortBy("default");
    setFilterInStock(false);
    setFilterOutOfStock(false);
    setSelectedPetTypes([]);
    setSelectedFoodTypes([]);
    setMaxPrice(100);
    toast.success("All filters cleared.", { icon: "🔄" });
  };

  // Shared Filters Form JSX Component (Slide-out Drawer)
  const renderFilterForm = () => (
    <div className="space-y-6 text-left">
      {/* Category Section */}
      <div className="border-b border-[#f0ebf8] pb-5">
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between font-bold text-xs text-brand-purple uppercase tracking-wider mb-3 outline-none cursor-pointer"
        >
          <span>Category</span>
          {categoriesOpen ? (
            <ChevronUp className="w-4 h-4 text-brand-purple/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-brand-purple/50" />
          )}
        </button>
        {categoriesOpen && (
          <div className="space-y-1 mt-2.5 max-h-56 overflow-y-auto scrollbar-none pr-1">
            {categoryOptions.map((cat) => (
              <button
                key={cat.id || "all-products"}
                onClick={() => handleCategoryChange(cat)}
                className={`block w-full text-left text-xs py-2 px-3 rounded-xl font-bold transition-all duration-200 ${
                  selectedCategory === cat.name
                    ? "bg-brand-purple/5 text-brand-purple"
                    : "text-brand-brown/70 hover:text-brand-purple hover:bg-brand-purple/[0.02]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Availability Section */}
      <div className="border-b border-[#f0ebf8] pb-5">
        <button
          onClick={() => setAvailabilityOpen(!availabilityOpen)}
          className="w-full flex items-center justify-between font-bold text-xs text-brand-purple uppercase tracking-wider mb-3 outline-none cursor-pointer"
        >
          <span>Availability</span>
          {availabilityOpen ? (
            <ChevronUp className="w-4 h-4 text-brand-purple/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-brand-purple/50" />
          )}
        </button>
        {availabilityOpen && (
          <div className="space-y-3 mt-3">
            {[
              {
                label: "In Stock Only",
                checked: filterInStock,
                setter: setFilterInStock,
              },
              {
                label: "Out of Stock Only",
                checked: filterOutOfStock,
                setter: setFilterOutOfStock,
              },
            ].map((opt) => (
              <label
                key={opt.label}
                className="flex items-center gap-3 text-xs font-bold text-brand-brown/80 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={(e) => opt.setter(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-[#e2dcf0] accent-brand-purple cursor-pointer focus:ring-0"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Pet Type Section */}
      <div className="border-b border-[#f0ebf8] pb-5">
        <button
          onClick={() => setPetTypeOpen(!petTypeOpen)}
          className="w-full flex items-center justify-between font-bold text-xs text-brand-purple uppercase tracking-wider mb-3 outline-none cursor-pointer"
        >
          <span>Pet Companion</span>
          {petTypeOpen ? (
            <ChevronUp className="w-4 h-4 text-brand-purple/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-brand-purple/50" />
          )}
        </button>
        {petTypeOpen && (
          <div className="space-y-3 mt-3">
            {PET_TYPES.map((pet) => (
              <label
                key={pet}
                className="flex items-center gap-3 text-xs font-bold text-brand-brown/80 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedPetTypes.includes(pet)}
                  onChange={() => handlePetTypeToggle(pet)}
                  className="w-4.5 h-4.5 rounded border-[#e2dcf0] accent-brand-purple cursor-pointer focus:ring-0"
                />
                <span>{pet} Care</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Food Type Section */}
      <div className="pb-4">
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="w-full flex items-center justify-between font-bold text-xs text-brand-purple uppercase tracking-wider mb-3 outline-none cursor-pointer"
        >
          <span>Price Limit</span>
          {priceOpen ? (
            <ChevronUp className="w-4 h-4 text-brand-purple/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-brand-purple/50" />
          )}
        </button>
        {priceOpen && (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-brand-cream/35 border border-brand-purple/10 rounded-xl p-3 text-left">
                <span className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-wider block">
                  Min
                </span>
                <span className="text-sm font-extrabold text-brand-purple">
                  $10
                </span>
              </div>
              <div className="bg-brand-cream/35 border border-brand-purple/10 rounded-xl p-3 text-left">
                <span className="text-[10px] font-bold text-brand-brown/40 uppercase tracking-wider block">
                  Max Price
                </span>
                <span className="text-sm font-extrabold text-brand-purple">
                  ${maxPrice}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <input
                type="range"
                min="10"
                max="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-purple cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-extrabold text-brand-brown/50 mt-1">
                <span>$10</span>
                <span>$100</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main
      className="flex-grow select-none py-12 relative min-h-screen bg-white overflow-x-hidden"
      // style={{
      //   background:
      //     "linear-gradient(180deg, #FFF7EF 0%, #FFFDFB 50%, #FFF7EF 100%)",
      // }}
    >
      {/* Decorative ambient page glows */}
      <div className="absolute top-20 right-0 w-[550px] h-[550px] bg-brand-purple/5 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-0 w-[450px] h-[450px] bg-brand-peach/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── SECTION 1: Borderless Modern E-Commerce Header with Highlights Grid ── */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 mb-14 text-left">
          {/* Left Column: Direct Typography Block */}
          <div className="max-w-2xl">
            <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] flex items-center gap-1.5">
              <Link
                to="/"
                className="hover:text-brand-purple transition-colors"
              >
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />
              <Link
                to="/products"
                className="hover:text-brand-purple transition-colors"
              >
                Products
              </Link>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-brand-purple leading-tight">
              Premium Pet Supplies & Care
            </h1>
            <p className="text-sm md:text-base text-brand-brown/70 font-medium mt-4 leading-relaxed">
              Discover premium nutrition, durable chew toys, orthopedic beds,
              and high-quality accessories designed to support your companion's
              active and happy lifestyle.
            </p>
          </div>

          {/* Right Column: Stack of Highlight benefit cards (Not a banner) */}
          <div className="w-full lg:w-[380px] space-y-3.5 shrink-0">
            {[
              {
                icon: ShieldCheck,
                title: "100% Pet-Safe Materials",
                desc: "All toys, accessories, and products are made of non-toxic, safe materials.",
                color: "border-[#FF9E8A]/20 bg-[#FFF7EF]/40",
                iconColor: "text-[#FF9E8A]",
              },
              {
                icon: Truck,
                title: "Free Delivery Over $49",
                desc: "Fast 1-2 day shipping directly to your front door.",
                color: "border-brand-purple/5 bg-brand-purple/[0.02]",
                iconColor: "text-[#a855f7]",
              },
              {
                icon: Calendar,
                title: "Save 10% with Autoship",
                desc: "Schedule regular deliveries easily. Pause or cancel anytime.",
                color: "border-black/5 bg-[#fffdfa]/60",
                iconColor: "text-brand-purple",
              },
            ].map((benefit, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex gap-3.5 shadow-sm transition-all duration-300 hover:translate-x-1 cursor-default ${benefit.color}`}
              >
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 border border-black/[0.02]">
                  <benefit.icon
                    className={`w-4.5 h-4.5 ${benefit.iconColor}`}
                  />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-extrabold text-brand-purple">
                    {benefit.title}
                  </h4>
                  <p className="text-[10.5px] text-brand-brown/60 font-semibold leading-relaxed mt-0.5">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 2: Category Carousel with Arrow Navigation ── */}
        <CouponOffers />

        <section className="mb-10 text-left">
          {/* Label row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-3.5 bg-brand-purple rounded-full block" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-brand-purple">
              Shop by Category
            </h3>
          </div>

          {/* Carousel row: [◀]  [pill track]  [▶] */}
          <div className="flex items-center gap-2 w-full overflow-hidden">
            {/* Left Arrow */}
            <button
              onClick={() => scrollCategories(-1)}
              disabled={!canScrollLeft}
              className={`flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                canScrollLeft
                  ? "border-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white hover:border-brand-purple cursor-pointer"
                  : "border-[#e5ddf0] text-brand-purple/20 cursor-not-allowed"
              }`}
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable pill track */}
            <div
              ref={categoryScrollRef}
              className="flex-1 min-w-0 overflow-x-auto scrollbar-none flex gap-2 pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {categoryOptions.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id || "all-products"}
                    data-selected={isSelected}
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all duration-200 outline-none active:scale-97 ${
                      isSelected
                        ? "bg-brand-purple text-white shadow-md shadow-brand-purple/20"
                        : "bg-white border border-[#e5ddf0] text-brand-purple hover:bg-brand-purple/[0.04] hover:border-brand-purple/20"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scrollCategories(1)}
              disabled={!canScrollRight}
              className={`flex-shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                canScrollRight
                  ? "border-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white hover:border-brand-purple cursor-pointer"
                  : "border-[#e5ddf0] text-brand-purple/20 cursor-not-allowed"
              }`}
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ── SECTION 3: Inline Control Actions Toolbar (Borderless, Natural Page Component) ── */}
        <section className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-purple/5 pb-6">
          {/* Active Info */}
          <div className="flex flex-wrap items-center gap-3 text-left w-full sm:w-auto">
            <h2 className="text-2xl font-display font-extrabold text-brand-purple leading-tight">
              {searchQuery ? `Products for "${searchQuery}"` : selectedCategory}
            </h2>
            <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-widest">
              ({isLoadingProducts ? "Loading" : filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "item" : "items"} total)
            </span>

            {searchQuery && (
              <div className="inline-flex items-center gap-2 bg-[#FFF7EF] border border-[#FF9E8A]/40 text-[#c2410c] px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                <span>Filter: {searchQuery}</span>
                <button
                  type="button"
                  onClick={() => handleSearchQueryChange("")}
                  className="hover:bg-[#FF9E8A]/20 rounded-full p-0.5 transition-colors cursor-pointer flex items-center justify-center"
                  title="Clear filter"
                  aria-label="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Actions - Commented out search, sort, and filter button as requested */}
          {/*
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative flex-grow sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                placeholder="Search catalog..."
                className="w-full sm:w-56 bg-white border border-[#e5ddf0] focus:border-brand-purple text-brand-purple placeholder:text-brand-brown/45 pl-9.5 pr-8 py-2.5 rounded-xl text-xs font-bold outline-none transition-all focus:bg-white shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchQueryChange("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-brown/40 hover:text-brand-purple p-0.5 rounded-full hover:bg-brand-purple/5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative hidden sm:block flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-white border border-[#e5ddf0] text-brand-purple text-xs font-bold pl-4.5 pr-9 py-2.5 rounded-xl outline-none appearance-none cursor-pointer hover:bg-brand-purple/[0.03] transition-all shadow-sm"
              >
                <option value="default">Sort: Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount-desc">Discount Percentage</option>
              </select>
              <ArrowUpDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-purple/40 pointer-events-none" />
            </div>

            <div className="relative flex sm:hidden w-10 h-10 flex-shrink-0 bg-white border border-[#e5ddf0] rounded-xl items-center justify-center shadow-sm hover:bg-brand-purple/[0.03] transition-all">
              <ArrowUpDown className="w-4 h-4 text-brand-purple" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              >
                <option value="default">Sort: Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount-desc">Discount Percentage</option>
              </select>
            </div>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="hidden sm:flex bg-white border border-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white text-xs font-bold px-6 py-2.5 rounded-xl items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-97 outline-none"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex sm:hidden flex-shrink-0 w-10 h-10 bg-white border border-brand-purple/10 text-brand-purple hover:bg-brand-purple/[0.03] items-center justify-center rounded-xl transition-all shadow-sm active:scale-97 outline-none cursor-pointer"
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
          */}
        </section>

        {/* ── PART 4: Products Grid Display ── */}
        {isLoadingProducts ? (
          /* Loading Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6.5 mt-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#f0ebf8] rounded-3xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-[380px]"
              >
                <div className="w-full h-48 bg-brand-purple/5 rounded-2xl mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-brand-purple/10 rounded-lg w-3/4" />
                  <div className="h-3 bg-brand-purple/5 rounded-lg w-1/2" />
                  <div className="h-6 bg-brand-purple/10 rounded-xl w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : apiError ? (
          /* API Error Card */
          <div className="bg-white border border-red-100 rounded-[24px] py-16 px-6 text-center max-w-md mx-auto shadow-sm w-full mt-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-extrabold text-brand-purple">
              Unable to load catalog
            </h3>
            <p className="text-xs text-brand-brown/60 mt-2 leading-relaxed font-semibold">
              {apiError}
            </p>
            <button
              onClick={loadProducts}
              className="bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md mt-6 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Fallback view when zero matches after loading completes */
          <div className="bg-white border border-[#f0ebf8] rounded-[24px] py-20 px-6 text-center max-w-md mx-auto shadow-sm w-full mt-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple/5 text-brand-purple flex items-center justify-center mx-auto mb-5 shadow-inner">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-extrabold text-brand-purple">
              No matching results
            </h3>
            <p className="text-xs text-brand-brown/60 mt-2 leading-relaxed font-semibold">
              We couldn't find any products that match your current filter
              settings. Try clearing filters or search criteria.
            </p>
            <button
              onClick={handleResetFilters}
              className="bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md mt-6 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* The Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6.5 mt-2">
            {paginatedProducts.map((product) => (
              <div
                key={product.id}
                className="transition-all duration-300 hover:scale-[1.01]"
              >
                <ProductCard
                  product={product}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={toggleWishlist}
                  onAddToCart={(prod, quantity, variantName) => {
                    addToCart(prod, 1);
                    toast.success(`${prod.name}${variantName ? ` — ${variantName}` : ""} added to cart! 🛒`);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {shouldShowPagination && filteredProducts.length > 0 && (
          <nav
            className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-purple/5 pt-6"
            aria-label="Product pagination"
          >
            <p className="text-[11px] font-bold text-brand-brown/55 uppercase tracking-widest">
              Showing {firstVisibleProduct}-{lastVisibleProduct} of{" "}
              {filteredProducts.length} products
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                  safeCurrentPage === 1
                    ? "border-[#e5ddf0] text-brand-purple/25 cursor-not-allowed"
                    : "border-brand-purple/15 text-brand-purple hover:bg-brand-purple hover:text-white cursor-pointer shadow-sm"
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === safeCurrentPage ? "page" : undefined}
                    className={`min-w-10 h-10 px-3 rounded-xl border text-xs font-extrabold transition-all duration-200 ${
                      page === safeCurrentPage
                        ? "bg-brand-purple border-brand-purple text-white shadow-md shadow-brand-purple/20"
                        : "bg-white border-[#e5ddf0] text-brand-purple hover:bg-brand-purple/[0.04] hover:border-brand-purple/20 cursor-pointer"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => setCurrentPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                  safeCurrentPage === totalPages
                    ? "border-[#e5ddf0] text-brand-purple/25 cursor-not-allowed"
                    : "border-brand-purple/15 text-brand-purple hover:bg-brand-purple hover:text-white cursor-pointer shadow-sm"
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* MOBILE SCREEN SLIDE-OVER FILTERS DRAWER - Commented out as requested */}
      {/*
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#f0ebf8]">
          <h3 className="text-sm font-extrabold text-brand-purple uppercase tracking-wider">
            Filters
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-[#a855f7] hover:underline outline-none"
            >
              Clear
            </button>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg hover:bg-brand-purple/5 text-brand-purple transition-all outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-5 py-5 scrollbar-none">
          {renderFilterForm()}
        </div>

        <div className="p-5 border-t border-[#f0ebf8] bg-[#faf8ff]">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-full bg-brand-purple hover:bg-[#3a0038] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md active:scale-97 text-center block text-xs outline-none cursor-pointer uppercase tracking-wider"
          >
            Apply Filters
          </button>
        </div>
      </div>
      */}
    </main>
  );
}
