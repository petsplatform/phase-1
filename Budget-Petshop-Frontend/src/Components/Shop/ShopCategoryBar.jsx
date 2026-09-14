import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function CategoryTab({ category, active, onClick }) {
  return (
    <button
      type="button"
      id={`category-tab-${category.id}`}
      onClick={() => onClick(category.id)}
      className="flex flex-col items-center gap-1.5 whitespace-nowrap rounded-2xl px-5 py-3 text-xs font-bold transition-all duration-200 active:scale-95 min-w-[80px] shrink-0"
      style={
        active
          ? {
            background: '#8a72c7',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(138,114,199,0.28)',
            border: '1.5px solid #8a72c7',
          }
          : {
            background: '#fff',
            color: '#1d2823',
            border: '1.5px solid #e7ddd0',
          }
      }
    >
      <span className="text-center leading-tight">{category.label}</span>
    </button>
  )
}

function ShopCategoryBar({ activeCategory, onCategoryChange, categories = [], isLoading = false }) {
  const scrollContainerRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 5)
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5)
    }
  }

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const clientWidth = scrollContainerRef.current.clientWidth
      const scrollAmount = clientWidth * 0.6
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      // Check initially and after layout mount
      checkScroll()
      // Run checking again in case image or font loading changes size
      const timer = setTimeout(checkScroll, 300)
      window.addEventListener('resize', checkScroll)

      return () => {
        container.removeEventListener('scroll', checkScroll)
        window.removeEventListener('resize', checkScroll)
        clearTimeout(timer)
      }
    }
  }, [])

  // Re-check scroll buttons when activeCategory changes, as it might auto-scroll or shift layout
  useEffect(() => {
    const timer = setTimeout(checkScroll, 50)
    return () => clearTimeout(timer)
  }, [activeCategory, categories.length, isLoading])

  return (
    <div className="relative flex items-center w-full">
      {/* Left Gradient Overlay */}
      {showLeftArrow && (
        <div
          className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none z-10 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to right, #fbf7f0 30%, transparent)' }}
        />
      )}

      {/* Left Arrow Button */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6d776f] shadow-md border border-[#e7ddd0] hover:border-[#8a72c7] hover:bg-[#F6F1FF] hover:text-[#8a72c7] transition-all duration-200 active:scale-95 ${showLeftArrow ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
        type="button"
        aria-label="Scroll categories left"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Categories Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 hide-scrollbar"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[46px] min-w-[92px] shrink-0 animate-pulse rounded-2xl border border-[#e7ddd0] bg-white"
            />
          ))
          : categories.map((cat) => (
            <CategoryTab
              key={cat.id}
              category={cat}
              active={activeCategory === cat.id}
              onClick={onCategoryChange}
            />
          ))}
      </div>

      {/* Right Gradient Overlay */}
      {showRightArrow && (
        <div
          className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-10 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to left, #fbf7f0 30%, transparent)' }}
        />
      )}

      {/* Right Arrow Button */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6d776f] shadow-md border border-[#e7ddd0] hover:border-[#8a72c7] hover:bg-[#F6F1FF] hover:text-[#8a72c7] transition-all duration-200 active:scale-95 ${showRightArrow ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'
          }`}
        type="button"
        aria-label="Scroll categories right"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default ShopCategoryBar
