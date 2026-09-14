import React, { useContext, useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { AuthContext } from "../../context/AuthContext";
import { isVetOnly, lacksVetAccess, getProductUrl, hasVariants } from "../../utils/productUtils";
import { productMatchesSearch } from "../../utils/searchUtils";
import { productApi } from "../../api/productApi";
import ProductImage from "../Common/ProductImage";
import {
  Heart,
  ShoppingCart,
  Eye,
  Filter,
  ArrowUpDown,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  SlidersHorizontal,
  DollarSign,
  Pill,
  Scissors,
  Activity,
  Stethoscope,
  Inbox,
  X,
  Tag,
  Sparkles,
  Star,
  ShieldCheck,
} from "lucide-react";

const getCategoryIcon = (categoryName = "") => {
  const cat = (categoryName || "").toLowerCase();
  if (
    cat.includes("medic") ||
    cat.includes("prescription") ||
    cat.includes("pharmacy") ||
    cat.includes("allergy") ||
    cat.includes("skin")
  ) {
    return <Pill className="w-4 h-4 shrink-0" />;
  }
  if (
    cat.includes("supple") ||
    cat.includes("vita") ||
    cat.includes("nutri") ||
    cat.includes("diet") ||
    cat.includes("chew")
  ) {
    return <Activity className="w-4 h-4 shrink-0" />;
  }
  if (
    cat.includes("groom") ||
    cat.includes("hygiene") ||
    cat.includes("coat") ||
    cat.includes("shampoo") ||
    cat.includes("oral") ||
    cat.includes("dental")
  ) {
    return <Scissors className="w-4 h-4 shrink-0" />;
  }
  if (
    cat.includes("diagnost") ||
    cat.includes("surg") ||
    cat.includes("first aid") ||
    cat.includes("clinic") ||
    cat.includes("tool") ||
    cat.includes("equip") ||
    cat.includes("thermometer") ||
    cat.includes("stethoscope")
  ) {
    return <Stethoscope className="w-4 h-4 shrink-0" />;
  }
  return <Tag className="w-4 h-4 shrink-0" />;
};

const ShopPage = () => {
  const { user } = useContext(AuthContext);
  const { products, loadingProducts, addToCart, toggleWishlist, isInWishlist } =
    useContext(AppContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter and Search States loaded from URL query params initially
  const categoryParam = searchParams.get("category") || "all";
  const searchParam = searchParams.get("search") || "";

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [priceRange, setPriceRange] = useState(null); // null means no price restriction
  const [sortBy, setSortBy] = useState("default");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [apiCategories, setApiCategories] = useState([]);

  // View states
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Sync state with URL parameter changes
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setCurrentPage(1); // Reset page on category change
  }, [categoryParam]);

  useEffect(() => {
    setSearchQuery(searchParam);
    setCurrentPage(1); // Reset page on search change
  }, [searchParam]);

  // Fetch API categories on mount
  useEffect(() => {
    let isMounted = true;
    const fetchApiCategories = async () => {
      try {
        const res = await productApi.getCategories();
        if (isMounted && Array.isArray(res) && res.length > 0) {
          setApiCategories(res);
        }
      } catch (err) {
        console.warn(
          "Notice: could not load API categories, using live product categories:",
          err,
        );
      }
    };
    fetchApiCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live dynamic departments list from products & API response
  const dynamicDepartments = useMemo(() => {
    const map = new Map();
    map.set("all", {
      id: "all",
      label: "All",
      icon: <Tag className="w-4 h-4 shrink-0" />,
    });

    // Collect dynamic categories from loaded products
    products.forEach((p) => {
      const rawCat = p.category || p.categoryName;
      if (rawCat && typeof rawCat === "string") {
        const key = rawCat.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            label: rawCat.trim(),
            icon: getCategoryIcon(rawCat),
          });
        }
      }
    });

    // Also include API categories if present
    apiCategories.forEach((catItem) => {
      const name =
        typeof catItem === "string" ? catItem : catItem?.name || catItem?.label;
      if (name && typeof name === "string") {
        const key = name.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            label: name.trim(),
            icon: getCategoryIcon(name),
          });
        }
      }
    });

    return Array.from(map.values());
  }, [products, apiCategories]);

  // Dynamically compute the maximum price in the catalog
  const maxCatalogPrice = useMemo(() => {
    if (!products || products.length === 0) return 5000;
    const maxP = Math.max(
      ...products.map((p) => Number(p.price ?? p.sellPrice ?? p.sellingPrice ?? 0))
    );
    return maxP > 0 ? Math.ceil(maxP) : 5000;
  }, [products]);

  const isProductInDepartment = (product, catId) => {
    if (!catId || catId.toLowerCase() === "all") return true;

    const productCat = (product.category || product.categoryName || "")
      .toLowerCase()
      .trim();
    const targetId = catId.toLowerCase().trim();

    if (productCat === targetId) return true;

    const targetDept = dynamicDepartments.find((d) => d.id === targetId);
    if (targetDept) {
      const deptLabel = targetDept.label.toLowerCase().trim();
      if (
        productCat === deptLabel ||
        productCat.includes(deptLabel) ||
        deptLabel.includes(productCat)
      ) {
        return true;
      }
    }

    // Flexible matching for category synonyms
    if (targetId.includes("medic") || targetId === "medicines") {
      return (
        productCat.includes("medic") ||
        productCat.includes("allergy") ||
        productCat.includes("skin") ||
        productCat.includes("antibiotic") ||
        productCat.includes("digestive") ||
        productCat.includes("heartworm") ||
        productCat.includes("pain") ||
        productCat.includes("arthritis") ||
        productCat.includes("flea") ||
        productCat.includes("tick")
      );
    }
    if (targetId.includes("supple") || targetId === "supplements") {
      return (
        productCat.includes("supple") ||
        productCat.includes("anxiety") ||
        productCat.includes("calming") ||
        productCat.includes("vitamin") ||
        productCat.includes("diet") ||
        productCat.includes("nutri")
      );
    }
    if (targetId.includes("groom") || targetId === "grooming") {
      return (
        productCat.includes("groom") ||
        productCat.includes("shampoo") ||
        productCat.includes("hygiene") ||
        productCat.includes("ear") ||
        productCat.includes("nail") ||
        productCat.includes("oral") ||
        productCat.includes("dental")
      );
    }
    if (targetId.includes("equip") || targetId === "equipment") {
      return (
        productCat.includes("equip") ||
        productCat.includes("diagnost") ||
        productCat.includes("tool") ||
        productCat.includes("surg") ||
        productCat.includes("first aid") ||
        productCat.includes("mask") ||
        productCat.includes("glove")
      );
    }

    return false;
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    const newParams = new URLSearchParams(searchParams);
    if (catId === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", catId);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (!val) {
      newParams.delete("search");
    } else {
      newParams.set("search", val);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setPriceRange(null);
    setSortBy("default");
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSearchParams({});
    setCurrentPage(1);
  };

  const matchesProductFilters = (product, categoryId = selectedCategory) => {
    const matchesCategory = isProductInDepartment(product, categoryId);
    const productPrice = Number(product.price ?? product.sellPrice ?? 0);
    const matchesSearch = productMatchesSearch(product, searchQuery);
    const matchesPrice =
      priceRange === null || priceRange === undefined
        ? true
        : productPrice <= priceRange;
    const matchesStock = !inStockOnly || product.stockQuantity > 0;
    const matchesSale = !onSaleOnly || product.discountPercent > 0;
    return (
      matchesCategory &&
      matchesSearch &&
      matchesPrice &&
      matchesStock &&
      matchesSale
    );
  };

  const getCategoryCount = (catId) =>
    products.filter((product) => matchesProductFilters(product, catId)).length;

  // Filter products logic
  const filteredProducts = products.filter((product) =>
    matchesProductFilters(product),
  );

  // Sort products logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name-az") return a.name.localeCompare(b.name);
    if (sortBy === "discount-high")
      return b.discountPercent - a.discountPercent;
    return 0; // Default
  });

  // Calculate Pagination values
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct,
  );
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSidebarFilters = () => {
    const hasAnyActiveFilters =
      selectedCategory.toLowerCase() !== "all" ||
      searchQuery !== "" ||
      (priceRange !== null && priceRange < maxCatalogPrice) ||
      sortBy !== "default" ||
      inStockOnly ||
      onSaleOnly;

    return (
      <div className="flex flex-col gap-6">
        {/* Keyword Search */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-extrabold uppercase tracking-widest text-[#627D98] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            <span>Keyword Search</span>
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-[#627D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl pl-10 pr-3.5 py-2.5 text-xs md:text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0874C9]/20 transition-all duration-300"
            />
          </div>
        </div>

        {/* Departments Selectors - commented out */}
        {/* <div className="flex flex-col gap-2.5">
          <label className="text-xs font-extrabold uppercase tracking-widest text-[#627D98] flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5" />
            <span>Category</span>
          </label>
          <div className="flex flex-col gap-1.5">
            {dynamicDepartments.map((cat) => {
              const count = getCategoryCount(cat.id);
              const isSelected =
                selectedCategory.toLowerCase() === cat.id.toLowerCase() ||
                (selectedCategory.toLowerCase() === "all" && cat.id === "all");
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`text-left px-3.5 py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#EAF5FC] text-[#0874C9]"
                      : "text-[#102A43] hover:bg-[#F7FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {cat.icon}
                    <span>{cat.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? "bg-[#0874C9] text-white"
                        : "bg-[#F7FAFC] border border-[#D9E8F2] text-[#627D98]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div> */}

        {/* Preferences checkboxes */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[#D9E8F2]/60">
          <label className="text-xs font-extrabold uppercase tracking-widest text-[#627D98] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 text-xs md:text-sm text-[#102A43] font-semibold cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4.5 h-4.5 rounded-md border-[#D9E8F2] text-[#0874C9] focus:ring-[#0874C9] cursor-pointer"
              />
              <span className="group-hover:text-[#0874C9] transition-colors">
                In Stock Only
              </span>
            </label>
            <label className="flex items-center gap-3 text-xs md:text-sm text-[#102A43] font-semibold cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => {
                  setOnSaleOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4.5 h-4.5 rounded-md border-[#D9E8F2] text-[#0874C9] focus:ring-[#0874C9] cursor-pointer"
              />
              <span className="group-hover:text-[#0874C9] transition-colors">
                On Sale Only
              </span>
            </label>
          </div>
        </div>

        {/* Price range sliders - commented out */}
        {/* <div className="flex flex-col gap-2.5 pt-4 border-t border-[#D9E8F2]/60">
          <div className="flex justify-between items-center text-xs font-extrabold uppercase tracking-widest text-[#627D98]">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Max Price</span>
            </span>
            <span className="text-[#0874C9] font-heading font-black text-sm">
              ${priceRange ?? maxCatalogPrice}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={maxCatalogPrice}
            step="5"
            value={priceRange ?? maxCatalogPrice}
            onChange={(e) => {
              setPriceRange(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full h-1.5 bg-[#D9E8F2] rounded-lg appearance-none cursor-pointer accent-[#0874C9]"
          />
          <div className="flex justify-between text-[10px] text-[#627D98] font-black">
            <span>$0</span>
            <span>${maxCatalogPrice}</span>
          </div>
        </div> */}

        {/* Reset button at the bottom of the filters card */}
        {hasAnyActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full mt-2 bg-gradient-to-r from-[#FFEBEB] to-[#FFEBEB] hover:from-[#F28C18] hover:to-[#F28C18] text-[#F28C18] hover:text-white border border-transparent hover:border-[#F28C18]/10 text-xs font-bold py-3.5 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="py-16 bg-[#F7FAFC] min-h-screen border-b border-[#D9E8F2] select-none text-left relative">
      {/* Mobile Drawer Backdrop - Commented out as requested */}
      {/* {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          onClick={() => setIsMobileFiltersOpen(false)}
        />
      )} */}

      {/* Mobile Drawer Panel - Commented out as requested */}
      {/* <div
        className={`fixed top-0 bottom-0 left-0 w-full max-w-xs bg-white z-[60] shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 lg:hidden ${isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-[#D9E8F2] pb-4 mb-6">
          <h3 className="font-heading font-black text-lg text-[#102A43] flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#0874C9]" />
            <span>Filters</span>
          </h3>
          <button
            onClick={() => setIsMobileFiltersOpen(false)}
            className="p-2 hover:bg-[#F7FAFC] rounded-full transition-colors cursor-pointer text-[#627D98] hover:text-[#0874C9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderSidebarFilters()}
      </div> */}

      <div className="container-custom">
        {/* Page Breadcrumb and Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="text-left">
            <span className="text-xs font-extrabold text-[#627D98] uppercase tracking-widest">
              Home / Shop Catalog
            </span>
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-[#102A43] mt-2 tracking-tight">
              Veterinary Shop Catalog
            </h1>
            <p className="text-sm text-[#627D98] mt-1.5">
              Browse professional clinical diagnostics, first-aid kits, surgical
              supplies, dietary capsules, and dental systems.
            </p>
          </div>
          <div className="bg-[#EAF5FC] text-[#0874C9] text-xs font-black px-4.5 py-2.5 rounded-full tracking-wide shadow-sm self-start md:self-auto flex items-center gap-1.5 shrink-0">
            <span>{sortedProducts.length}</span>
            <span className="uppercase text-[10px]">Products Available</span>
          </div>
        </div>

        {/* Catalog Body Grid - Full Width with Filters Commented Out */}
        <div className="w-full flex flex-col items-start">
          {/* Left Column: Sidebar Filters (Sticky) - Commented out as requested */}
          {/* <div className="hidden lg:block lg:col-span-3 bg-white border border-[#D9E8F2] rounded-2xl p-6 shadow-sm sticky top-28 self-start">
            <div className="flex items-center justify-between border-b border-[#D9E8F2] pb-4 mb-6">
              <h3 className="font-heading font-black text-base text-[#102A43] flex items-center gap-2">
                <Filter className="w-4.5 h-4.5 text-[#0874C9]" />
                <span>Filters</span>
              </h3>
              {(selectedCategory.toLowerCase() !== "all" ||
                searchQuery !== "" ||
                (priceRange !== null && priceRange < maxCatalogPrice) ||
                sortBy !== "default" ||
                inStockOnly ||
                onSaleOnly) && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-[#F28C18] hover:text-[#0874C9] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            {renderSidebarFilters()}
          </div> */}

          {/* Right Column: Grid and Sorting */}
          <div className="w-full flex flex-col">
            {/* Mobile Filter Button Bar */}
            <div className="flex lg:hidden items-center gap-3 w-full mb-6">
              {/* <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0B2D4F] hover:bg-[#0874C9] text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Filter className="w-4.5 h-4.5" />
                <span>Filters</span>
              </button> */}
              <div className="w-full relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white border border-[#D9E8F2] rounded-xl pl-4 pr-10 py-3.5 text-xs font-semibold text-[#102A43] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0874C9] cursor-pointer"
                >
                  <option value="default">Default Sorting</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A to Z</option>
                  <option value="discount-high">Highest Discount</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#627D98]" />
                </div>
              </div>
            </div>

            {/* Desktop Toolbar: filter stats and sorting selections */}
            <div className="bg-white border border-[#D9E8F2] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 mb-6">
              <span className="text-xs md:text-sm font-semibold text-[#627D98]">
                Showing{" "}
                <strong className="text-[#102A43]">
                  {sortedProducts.length}
                </strong>{" "}
                products in catalog.
              </span>

              {/* Sorting triggers and View toggle */}
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3">
                  <ArrowUpDown className="w-4 h-4 text-[#627D98]" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0874C9]/20 transition-all cursor-pointer"
                  >
                    <option value="default">Default Sorting</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-az">Name: A to Z</option>
                    <option value="discount-high">Highest Discount</option>
                  </select>
                </div>

                <div className="h-5 w-px bg-[#D9E8F2] hidden sm:block" />

                <div className="flex items-center bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none ${viewMode === "grid" ? "bg-white text-[#0874C9] shadow-sm border border-[#D9E8F2]/60" : "text-[#627D98] hover:text-[#102A43]"}`}
                    aria-label="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none ${viewMode === "list" ? "bg-white text-[#0874C9] shadow-sm border border-[#D9E8F2]/60" : "text-[#627D98] hover:text-[#102A43]"}`}
                    aria-label="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Shop Product Grid / List */}
            {loadingProducts ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-[#D9E8F2] rounded-2xl p-4 animate-pulse flex flex-col justify-between h-[400px]"
                    >
                      <div>
                        <div className="aspect-square w-full bg-slate-100 rounded-xl mb-4" />
                        <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
                        <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-slate-100 rounded w-full mb-1" />
                        <div className="h-3 bg-slate-100 rounded w-2/3" />
                      </div>
                      <div className="pt-3 border-t border-[#D9E8F2]/60">
                        <div className="h-5 bg-slate-100 rounded w-1/3 mb-3" />
                        <div className="h-10 bg-slate-100 rounded-full w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-white border border-[#D9E8F2] rounded-2xl p-4 md:p-5 animate-pulse flex flex-col sm:flex-row items-center gap-5 w-full h-[180px]"
                    >
                      <div className="w-full sm:w-44 aspect-square rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 flex flex-col justify-between w-full h-full">
                        <div>
                          <div className="h-3 bg-slate-100 rounded w-24 mb-3" />
                          <div className="h-5 bg-slate-100 rounded w-1/2 mb-2" />
                          <div className="h-3 bg-slate-100 rounded w-3/4" />
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-[#D9E8F2]/60">
                          <div className="h-5 bg-slate-100 rounded w-20" />
                          <div className="h-10 bg-slate-100 rounded-full w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : currentProducts.length === 0 ? (
              <div className="bg-white border border-[#D9E8F2] rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm w-full">
                <Inbox className="w-16 h-16 text-[#9FB3C8] mb-4 stroke-[1.2]" />
                <h3 className="font-heading font-black text-lg text-[#102A43]">
                  No Products Found
                </h3>
                <p className="text-xs text-[#627D98] mt-1.5 max-w-sm leading-relaxed">
                  We couldn't find matches for your active filters. Try
                  adjusting your keyword, resetting the price range, or
                  department type.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-6 bg-[#0874C9] hover:bg-[#F28C18] text-white text-xs font-bold px-8 py-3 rounded-full transition-all duration-300 cursor-pointer hover:-translate-y-0.5 shadow-md shadow-[#0874C9]/10 hover:shadow-[#F28C18]/10"
                >
                  Clear All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View Mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((product) => {
                  const isWish = isInWishlist(product.id);
                  const discount = product.discountPercent;
                  const isOutOfStock = product.stockQuantity === 0;
                  const requiresVet = isVetOnly(product);
                  const userLacksVet = lacksVetAccess(product, user);

                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(getProductUrl(product))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(getProductUrl(product));
                        }
                      }}
                      className="group bg-white border border-[#D9E8F2] hover:border-[#0874C9]/35 rounded-2xl p-4 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between relative h-full transform hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0874C9]"
                    >
                      {/* Top Actions Layer */}
                      <div className="relative">
                        {/* Wishlist toggle - commented out on cards */}
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className={`absolute top-0 right-0 z-10 p-2 bg-white rounded-full border border-[#D9E8F2] shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer ${
                            isWish
                              ? "text-red-500"
                              : "text-[#627D98] hover:text-[#0874C9]"
                          }`}
                          aria-label="Toggle Wishlist"
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform group-active:scale-95 ${isWish ? "fill-red-500" : ""}`}
                          />
                        </button> */}

                        {/* Badges */}
                        <div className="absolute top-0 left-0 z-10 flex flex-col gap-1">
                          {requiresVet && (
                            <span className="rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shadow-sm bg-[#0874C9] text-white flex items-center gap-1">
                              <ShieldCheck size={10} className="text-amber-300" />
                              Vet Required
                            </span>
                          )}
                          {discount > 0 && (
                            <div className="bg-[#F28C18] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md select-none tracking-wide shadow-sm self-start">
                              -{discount}%
                            </div>
                          )}
                        </div>

                        {/* Product Thumbnail */}
                        <div className="aspect-square bg-[#F7FAFC] rounded-xl overflow-hidden mb-4 border border-[#D9E8F2] group-hover:border-[#0874C9]/20 transition-colors">
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            product={product}
                            loading="lazy"
                            className="w-full h-full object-cover transform duration-700 group-hover:scale-[1.03]"
                          />
                        </div>
                      </div>

                      {/* Card Content details */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          {/* Category row */}
                          <div className="flex items-center gap-2 border-b border-[#D9E8F2]/40 pb-2 mb-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded">
                              {product.category}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-base text-[#102A43] mt-1 line-clamp-1 group-hover:text-[#0874C9] leading-snug">
                            {product.name}
                          </h3>

                          {Boolean(product.reviewCount || product.numReviews || product.ratingsCount || (Array.isArray(product.reviews) && product.reviews.length > 0)) && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= Math.round(Number(product.rating || 5))
                                        ? "fill-[#F28A16] text-[#F28A16]"
                                        : "fill-transparent text-[#CBD5E1]"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-extrabold text-[#627D98]">
                                {Number(product.rating || 5).toFixed(1)}
                              </span>
                            </div>
                          )}

                          <p className="text-[13px] text-[#627D98] leading-relaxed mt-1 line-clamp-2 min-h-[32px]">
                            {product.shortDescription || product.description}
                          </p>
                        </div>

                        {/* Bottom Actions grid */}
                        <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-[#D9E8F2]/60">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-extrabold text-[#0874C9]">
                              ${product.price.toFixed(2)}
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="text-xs text-[#627D98] line-through font-semibold">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {(() => {
                            const isVar = hasVariants(product);
                            return (
                              <button
                                disabled={isOutOfStock || userLacksVet}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (userLacksVet) {
                                    navigate(user ? "/account/vet-verification" : "/login");
                                    return;
                                  }
                                  if (isOutOfStock) return;
                                  if (isVar) {
                                    navigate(getProductUrl(product));
                                  } else {
                                    addToCart(product, 1);
                                  }
                                }}
                                className={`w-full font-bold text-xs py-3 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
                                  userLacksVet
                                    ? "bg-[#0874C9]/40 text-white cursor-not-allowed shadow-none border-none opacity-90"
                                    : !isOutOfStock
                                    ? "bg-[#0874C9] hover:bg-[#F28C18] text-white shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15 hover:-translate-y-0.5 cursor-pointer"
                                    : "bg-[#F7FAFC] text-[#9FB3C8] border border-[#D9E8F2] cursor-not-allowed"
                                }`}
                              >
                                {!userLacksVet && (
                                  isVar ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : (
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  )
                                )}
                                <span>
                                  {userLacksVet
                                    ? "Apply for Verification"
                                    : isOutOfStock
                                    ? "Out of Stock"
                                    : isVar
                                    ? "View Variant"
                                    : "Add to Cart"}
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View Mode */
              <div className="flex flex-col gap-4">
                {currentProducts.map((product) => {
                  const isWish = isInWishlist(product.id);
                  const discount = product.discountPercent;
                  const isOutOfStock = product.stockQuantity === 0;
                  const userLacksVet = lacksVetAccess(product, user);

                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(getProductUrl(product))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(getProductUrl(product));
                        }
                      }}
                      className="group bg-white border border-[#D9E8F2] hover:border-[#0874C9]/35 rounded-2xl p-4 md:p-5 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col sm:flex-row items-center gap-5 md:gap-6 relative w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0874C9]"
                    >
                      {/* Product Image on Left */}
                      <div className="w-full sm:w-44 aspect-square shrink-0 rounded-xl overflow-hidden relative border border-[#D9E8F2] bg-[#F7FAFC]">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          product={product}
                          loading="lazy"
                          className="w-full h-full object-cover transform duration-500 group-hover:scale-[1.03]"
                        />
                        {/* Discount Badge */}
                        {discount > 0 && (
                          <div className="absolute top-2.5 left-2.5 bg-[#F28C18] text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm select-none">
                            -{discount}%
                          </div>
                        )}
                        {/* Wishlist Indicator Button - commented out on cards */}
                        {/* <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          className={`absolute top-2.5 right-2.5 p-1.5 bg-white rounded-full shadow-sm border border-[#D9E8F2] transition-colors cursor-pointer text-[#627D98] hover:text-[#0874C9]`}
                          aria-label="Toggle Wishlist"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${isWish ? "fill-red-500 text-red-500" : ""}`}
                          />
                        </button> */}
                      </div>

                      {/* Details in Center/Right */}
                      <div className="flex-1 flex flex-col justify-between py-1 w-full h-full">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded">
                              {product.category}
                            </span>
                          </div>

                          <h3 className="font-heading font-bold text-base text-[#102A43] group-hover:text-[#0874C9] transition-colors leading-snug">
                            {product.name}
                          </h3>
                          <p className="text-[13px] text-[#627D98] leading-relaxed mt-2 line-clamp-2">
                            {product.shortDescription || product.description}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-3.5 border-t border-[#D9E8F2]/60 w-full">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-extrabold text-[#0874C9]">
                              ${product.price.toFixed(2)}
                            </span>
                            {product.originalPrice > product.price && (
                              <span className="text-xs text-[#627D98] line-through font-semibold">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {(() => {
                            const isVar = hasVariants(product);
                            return (
                              <button
                                disabled={isOutOfStock || userLacksVet}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (userLacksVet) {
                                    navigate(user ? "/account/vet-verification" : "/login");
                                    return;
                                  }
                                  if (isOutOfStock) return;
                                  if (isVar) {
                                    navigate(getProductUrl(product));
                                  } else {
                                    addToCart(product, 1);
                                  }
                                }}
                                className={`font-bold text-xs py-3 px-6 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center gap-2 ${
                                  userLacksVet
                                    ? "bg-[#0874C9]/40 text-white cursor-not-allowed shadow-none border-none opacity-90"
                                    : !isOutOfStock
                                    ? "bg-[#0874C9] hover:bg-[#F28C18] text-white shadow-[#0874C9]/15 hover:shadow-[#F28C18]/15 hover:-translate-y-0.5 cursor-pointer"
                                    : "bg-[#F7FAFC] text-[#9FB3C8] border border-[#D9E8F2] cursor-not-allowed"
                                }`}
                              >
                                {!userLacksVet && (
                                  isVar ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : (
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  )
                                )}
                                <span>
                                  {userLacksVet
                                    ? "Apply for Verification"
                                    : isOutOfStock
                                    ? "Out of Stock"
                                    : isVar
                                    ? "View Variant"
                                    : "Add to Cart"}
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-[#D9E8F2]/40">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 border border-[#D9E8F2] rounded-xl text-[#627D98] hover:text-[#0874C9] disabled:opacity-30 disabled:hover:text-[#627D98] bg-white cursor-pointer shadow-sm hover:scale-105 transition-all"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 ${
                      currentPage === i + 1
                        ? "bg-[#0874C9] text-white"
                        : "bg-white border border-[#D9E8F2] text-[#627D98] hover:bg-[#EAF5FC] hover:text-[#0874C9]"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    paginate(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2.5 border border-[#D9E8F2] rounded-xl text-[#627D98] hover:text-[#0874C9] disabled:opacity-30 disabled:hover:text-[#627D98] bg-white cursor-pointer shadow-sm hover:scale-105 transition-all"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
