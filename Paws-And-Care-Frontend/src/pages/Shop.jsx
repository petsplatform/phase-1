import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ShopHero from '../components/shop/ShopHero';
import ShopToolbar from '../components/shop/ShopToolbar';
import FilterSidebar from '../components/shop/FilterSidebar';
import MobileFilterDrawer from '../components/shop/MobileFilterDrawer';
import ProductGrid from '../components/shop/ProductGrid';
import Pagination from '../components/shop/Pagination';

const PRODUCTS_PER_PAGE = 8;

// ─── Default Filter State ─────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  categories: [],
  minPrice: 0,
  maxPrice: 200,
};

export default function Shop({ wishlist = [], onToggleWishlist, onAddToCart, products = [], catalogError = '', loading = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search') || searchParams.get('q');
    
    if (categoryParam) {
      setFilters((prev) => ({ ...prev, categories: [categoryParam] }));
    }
    if (searchParam !== null && searchParam !== undefined) {
      setSearch(searchParam);
    } else {
      setSearch('');
    }
    setCurrentPage(1);
  }, [searchParams]);

  // ── Search & Filter handlers ────────────────────────────────────────────────
  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
    if (searchParams.get('search') || searchParams.get('q') || searchParams.get('category')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      newParams.delete('q');
      newParams.delete('category');
      setSearchParams(newParams, { replace: true });
    }
    setCurrentPage(1);
  }, [searchParams, setSearchParams]);

  // ── Active filter count ───────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    return (
      (filters.categories?.length || 0) +
      (filters.maxPrice < 200 ? 1 : 0) +
      (search.trim() ? 1 : 0)
    );
  }, [filters, search]);

  // ── Filter + sort pipeline ────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }

    // Category
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    // Price
    result = result.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    // Sort
    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default: // featured: best sellers first
        result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [filters, search, sort, products]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Category product counts (for sidebar) ─────────────────────────────────
  const productCounts = useMemo(() => {
    const categories = {};
    products.forEach((p) => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    return { categories };
  }, [products]);

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Hero Banner */}
      <ShopHero />

      {/* Main layout */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex gap-6 lg:gap-8 items-start">

          {/* ── Desktop Sidebar commented out so product grid takes full width ── */}
          {/*
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
              productCounts={productCounts}
            />
          </aside>
          */}

          {/* ── Content ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Toolbar */}
            <ShopToolbar
              totalCount={filteredProducts.length}
              search={search}
              onSearchChange={handleSearchChange}
              sort={sort}
              onSortChange={(v) => { setSort(v); setCurrentPage(1); }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onOpenMobileFilter={() => setMobileFilterOpen(true)}
              activeFilterCount={activeFilterCount}
              loading={loading}
            />

            {/* Product grid / list */}
            <ProductGrid
              products={paginatedProducts}
              wishlist={wishlist}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              viewMode={viewMode}
              loading={loading}
              emptyTitle={catalogError ? 'Catalog Unavailable' : 'No Products Found'}
              emptyMessage={
                catalogError ||
                "We couldn't find any products matching your current filters. Try adjusting or clearing your search criteria."
              }
              onClearFilters={!catalogError && activeFilterCount > 0 ? handleClearAll : undefined}
            />

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        productCounts={productCounts}
      />
    </div>
  );
}
