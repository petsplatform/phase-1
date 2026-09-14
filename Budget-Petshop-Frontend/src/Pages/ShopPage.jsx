import { useMemo, useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useNotification } from '../utils/NotificationContext'
import { productApi } from '../api/productApi'
import { applyFilters, filterByCategory, getPriceRange } from '../utils/shopFilters'
import ShopHeroBanner from '../Components/Shop/ShopHeroBanner'
import ShopCategoryBar from '../Components/Shop/ShopCategoryBar'
import ShopProductCard from '../Components/Shop/ShopProductCard'
import ShopEmptyState from '../Components/Shop/ShopEmptyState'
import ShopFilterDrawer from '../Components/Shop/ShopFilterDrawer'
import ShopPagination from '../Components/Shop/ShopPagination'
import { ProductCardSkeleton } from '../Components/common/ProductCardSkeleton'

const PRODUCTS_PER_PAGE = 12
const INITIAL_CATEGORY = 'all'
const ALL_CATEGORY = { id: INITIAL_CATEGORY, label: 'All Products' }

const normalizeCategoryOption = (category = {}) => ({
  id: String(category.id || category.name || ''),
  label: category.name || category.label || 'Category',
  productCount: Number(category?._count?.products || category.productCount || 0),
})

function ShopPage({ onAddToCart, wishlistIds = [], onToggleWishlist }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const querySearch =
    searchParams.get('search') ||
    searchParams.get('petType') ||
    searchParams.get('q') ||
    ''
  const queryCategory = searchParams.get('category') || INITIAL_CATEGORY

  const [category, setCategory] = useState(queryCategory)
  const [search, setSearch] = useState(querySearch)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [apiCategories, setApiCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Newsletter states and handers
  const { showNotification } = useNotification()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterError, setNewsletterError] = useState('')

  const handleNewsletterSubscribe = (e) => {
    e.preventDefault()
    const trimmedEmail = newsletterEmail.trim()
    
    if (!trimmedEmail) {
      setNewsletterError('Email is required.')
      showNotification('Email address is required.', 'error')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setNewsletterError('Please enter a valid email address.')
      showNotification('Please enter a valid email address.', 'error')
      return
    }

    setNewsletterError('')
    showNotification('Successfully subscribed to our newsletter!', 'success')
    setNewsletterEmail('')
  }

  useEffect(() => {
    const querySearch =
      searchParams.get('search') ||
      searchParams.get('petType') ||
      searchParams.get('q') ||
      ''
    const queryCategory = searchParams.get('category') || INITIAL_CATEGORY
    setSearch(querySearch)
    setCategory(queryCategory)
    setCurrentPage(1)
  }, [searchParams])

  useEffect(() => {
    let isMounted = true

    productApi
      .getProducts({ limit: 200 })
      .then((data) => {
        if (!isMounted) return
        const apiProducts = Array.isArray(data.items) ? data.items : []
        if (apiProducts.length) setProducts(apiProducts)
      })
      .catch((error) => {
        console.error('Failed to load store products:', error)
      })
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    productApi
      .getCategories()
      .then((items) => {
        if (!isMounted) return
        setApiCategories(Array.isArray(items) ? items.map(normalizeCategoryOption).filter((cat) => cat.id) : [])
      })
      .catch((error) => {
        console.error('Failed to load store categories:', error)
        if (isMounted) setApiCategories([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const categoryOptions = useMemo(
    () => [ALL_CATEGORY, ...apiCategories],
    [apiCategories],
  )

  // Price range derived from full product list
  const { max: absoluteMax } = useMemo(() => getPriceRange(products), [products])
  const [maxPrice, setMaxPrice] = useState(absoluteMax)

  useEffect(() => {
    setMaxPrice(absoluteMax)
  }, [absoluteMax])

  // Availability
  const [inStock, setInStock] = useState(true)
  const [outOfStock, setOutOfStock] = useState(true)

  // Pet type multi-select
  const [petTypes, setPetTypes] = useState([])
  function togglePetType(pet) {
    setPetTypes((prev) =>
      prev.includes(pet) ? prev.filter((p) => p !== pet) : [...prev, pet]
    )
  }

  // Food type multi-select
  const [foodTypes, setFoodTypes] = useState([])
  function toggleFoodType(ft) {
    setFoodTypes((prev) =>
      prev.includes(ft) ? prev.filter((f) => f !== ft) : [...prev, ft]
    )
  }

  // Category + Search / PetType filter
  const filtered = useMemo(() => {
    let result = filterByCategory(products, category);

    const term = search?.trim().toLowerCase();
    if (!term) return result;

    return result.filter((p) => {
      const petTypeMatch =
        p.petType && String(p.petType).toLowerCase().includes(term);
      const titleMatch =
        p.title && String(p.title).toLowerCase().includes(term);
      const nameMatch =
        p.name && String(p.name).toLowerCase().includes(term);
      const categoryMatch =
        (p.categoryName &&
          String(p.categoryName).toLowerCase().includes(term)) ||
        (p.category && String(p.category).toLowerCase().includes(term));
      const descMatch =
        p.description && String(p.description).toLowerCase().includes(term);

      return (
        petTypeMatch || titleMatch || nameMatch || categoryMatch || descMatch
      );
    });
  }, [products, category, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE))
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
    return filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)
  }, [currentPage, filtered])

  // Get current category label for heading
  const activeCategoryLabel = useMemo(() => {
    if (search) return `Results for "${search}"`;
    return (
      categoryOptions.find((c) => c.id === category)?.label ?? 'All Products'
    );
  }, [search, category, categoryOptions]);

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory)
    setCurrentPage(1)
    setSearchParams((prev) => {
      if (nextCategory === INITIAL_CATEGORY) {
        prev.delete('category')
      } else {
        prev.set('category', nextCategory)
      }
      return prev
    })
  }

  function handleSearchChange(nextSearch) {
    setSearch(nextSearch)
    setCurrentPage(1)
    setSearchParams((prev) => {
      if (!nextSearch) {
        prev.delete('search')
      } else {
        prev.set('search', nextSearch)
      }
      return prev
    })
  }

  function handleMaxPriceChange(nextPrice) {
    setMaxPrice(nextPrice)
    setCurrentPage(1)
  }

  function handleClearFilters() {
    setCategory(INITIAL_CATEGORY)
    setSearch('')
    setMaxPrice(absoluteMax)
    setInStock(true)
    setOutOfStock(false)
    setPetTypes([])
    setFoodTypes([])
    setFiltersOpen(false)
    setCurrentPage(1)
    setSearchParams({})
  }

  function handleApplyFilters() {
    setFiltersOpen(false)
  }

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages)
    setCurrentPage(safePage)
    document.getElementById('shop-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className='bg-white'>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="page-shell bg-white px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <ShopHeroBanner />
      </section>

      {/* ── Control Panel (Category Bar Active, Search/Filters Drawer Commented Out) ── */}
      <section
        className="sticky z-30 bg-background/95 border-b border-[#e7ddd0] backdrop-blur py-3"
        style={{ top: 'var(--navbar-height, 120px)' }}
        id="shop-controls"
      >
        <div className="page-shell px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full">
            {/* Category Scrollbar */}
            <div className="flex-1 min-w-0">
              <ShopCategoryBar
                activeCategory={category}
                onCategoryChange={handleCategoryChange}
                categories={categoryOptions}
                isLoading={isLoadingCategories}
              />
            </div>

            {/* Right: Search + Filter [Commented Out] */}
            {/*
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between shrink-0">
              <div className="relative flex-1 lg:w-48 lg:flex-initial focus-within:lg:w-64 transition-all duration-300">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6d776f] pointer-events-none"
                />
                <input
                  id="shop-search"
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-full bg-white py-2 pl-10 pr-4 text-xs font-semibold outline-none border border-[#e7ddd0] focus:ring-2 focus:ring-[#8a72c7]/20 transition-all"
                  style={{ color: '#1d2823' }}
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-[#f0f0f0] transition"
                  >
                    <X size={13} style={{ color: '#6d776f' }} />
                  </button>
                )}
              </div>

              <button
                type="button"
                id="toggle-filters-btn"
                onClick={() => setFiltersOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 border shrink-0 bg-white"
                style={
                  filtersOpen
                    ? { background: '#8a72c7', color: '#fff', border: '1.5px solid #8a72c7', boxShadow: '0 4px 12px rgba(138,114,199,0.25)' }
                    : { color: '#1d2823', border: '1.5px solid #e7ddd0' }
                }
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
            </div>
            */}
          </div>
        </div>
      </section>

      {/* ── Products Grid ── */}
      <section className="page-shell px-4 py-2 sm:px-6 lg:px-8" id="shop-products">

        {/* Section heading */}
        <div className="mt-8 mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="mt-3 text-2xl font-extrabold text-secondary sm:text-3xl">
              {activeCategoryLabel}
            </h2>
          </div>

          <span
            className="hidden rounded-full px-4 py-2 text-sm font-semibold sm:block"
            style={{ background: '#f4efe6', color: '#6d776f' }}
          >
            {isLoadingProducts ? 'Loading...' : `${filtered.length} items`}
          </span>
        </div>

        {/* Product grid */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {isLoadingProducts ? (
            Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          ) : filtered.length > 0 ? (
            paginatedProducts.map((product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                isWished={
                  wishlistIds.map(String).includes(String(product.id)) ||
                  (product.productId && wishlistIds.map(String).includes(String(product.productId)))
                }
                onToggleWishlist={onToggleWishlist}
              />
            ))
          ) : (
            <ShopEmptyState onClearFilters={handleClearFilters} />
          )}
        </div>

        <ShopPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={PRODUCTS_PER_PAGE}
          onPageChange={handlePageChange}
        />
      </section>


      {/* ── Filter side drawer [Commented Out] ────────────────────────────── */}
      {/*
      <ShopFilterDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onReset={handleClearFilters}
        category={category}
        onCategoryChange={handleCategoryChange}
        maxPrice={maxPrice}
        onMaxPriceChange={handleMaxPriceChange}
        priceMax={absoluteMax}
        onApply={handleApplyFilters}
        inStock={inStock}
        outOfStock={outOfStock}
        onInStockChange={setInStock}
        onOutOfStockChange={setOutOfStock}
        petTypes={petTypes}
        onPetTypeChange={togglePetType}
        foodTypes={foodTypes}
        onFoodTypeChange={toggleFoodType}
        products={products}
        categories={categoryOptions}
        isLoadingCategories={isLoadingCategories}
      />
      */}
    </main>
  )
}

export default ShopPage
