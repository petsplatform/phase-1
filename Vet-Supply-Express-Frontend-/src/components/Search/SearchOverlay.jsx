import React, { useContext, useEffect, useRef, useState } from "react";
import { Search, X, History, TrendingUp, ShoppingCart, ArrowRight } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import ProductImage from "../Common/ProductImage";
import { productMatchesSearch } from "../../utils/searchUtils";
import { getProductUrl } from "../../utils/productUtils";

const SearchOverlay = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    products,
    loadingProducts,
    recentSearches,
    addRecentSearch,
    addToCart
  } = useContext(AppContext);

  const [inputVal, setInputVal] = useState("");
  const [results, setResults] = useState([]);
  
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input on mount
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  // Live search filtering
  useEffect(() => {
    if (!inputVal.trim()) {
      setResults([]);
      return;
    }

    const filtered = products.filter((product) =>
      productMatchesSearch(product, inputVal),
    );
    setResults(filtered);
  }, [inputVal, products]);

  // Close search on Esc key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      addRecentSearch(inputVal);
      setIsSearchOpen(false);
      navigate(`/shop?search=${encodeURIComponent(inputVal.trim())}`);
    }
  };

  const handleSuggestionClick = (query) => {
    setInputVal(query);
    addRecentSearch(query);
    setIsSearchOpen(false);
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  };

  const popularSuggestions = [
    "Apoquel",
    "Chewables",
    "Supplements",
    "Shampoo",
    "Needle"
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Search Header Container */}
      <div className="border-b border-[#D9E8F2] bg-white py-4 md:py-6 shadow-sm">
        <div className="container-custom flex items-center justify-between gap-4">
          
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 relative">
            <Search className="w-5 h-5 md:w-6 md:h-6 text-[#627D98] absolute left-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search medicines, supplements, grooming products..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-[#F7FAFC] border border-[#D9E8F2] focus:border-[#0874C9] rounded-full pl-12 pr-4 py-3 md:py-3.5 text-sm md:text-base text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0874C9]/20"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal("")}
                className="absolute right-4 text-[#627D98] hover:text-[#102A43] text-xs font-bold bg-[#EAF5FC] px-2 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>

          {/* Close Trigger */}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#102A43] hover:text-red-500 transition-colors p-2.5 rounded-full hover:bg-red-50 cursor-pointer"
            aria-label="Close search overlay"
          >
            <X className="w-6 h-6 stroke-[1.8]" />
            <span className="hidden md:inline select-none">Close (Esc)</span>
          </button>
        </div>
      </div>

      {/* Overlay Body Content */}
      <div className="flex-1 overflow-y-auto bg-[#F7FAFC] py-8 select-none">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: suggestions and history */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-[#D9E8F2] shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#627D98] flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-[#0874C9]" />
                  <span>Recent Searches</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(search)}
                      className="bg-[#F7FAFC] hover:bg-[#EAF5FC] border border-[#D9E8F2] hover:border-[#0874C9]/30 text-xs md:text-sm text-[#102A43] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="bg-white p-6 rounded-2xl border border-[#D9E8F2] shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#627D98] flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#F28C18]" />
                <span>Suggested Keywords</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {popularSuggestions.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(term)}
                    className="bg-[#F7FAFC] hover:bg-[#EAF5FC] border border-[#D9E8F2] hover:border-[#F28C18]/30 text-xs md:text-sm text-[#102A43] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right panel: Live Search Results */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl border border-[#D9E8F2] shadow-sm min-h-[300px] flex flex-col">
              
              {loadingProducts ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0874C9] mb-3"></div>
                  <p className="text-xs text-[#627D98] font-medium">Loading catalog products...</p>
                </div>
              ) : inputVal === "" ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <Search className="w-12 h-12 text-[#D9E8F2] mb-3 stroke-[1.2]" />
                  <h4 className="text-sm font-semibold text-[#102A43]">Search Catalog</h4>
                  <p className="text-xs text-[#627D98] mt-1 max-w-xs">
                    Start typing to search across veterinary medicines, health supplements, hygiene, and tools.
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <X className="w-12 h-12 text-red-300 mb-3 stroke-[1.2]" />
                  <h4 className="text-sm font-semibold text-[#102A43]">No Products Matched</h4>
                  <p className="text-xs text-[#627D98] mt-1">
                    Try checking spelling or search a different keyword like "Apoquel" or "Shampoo".
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between border-b border-[#D9E8F2] pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#627D98]">
                      Product Matches ({results.length})
                    </span>
                    <button
                      onClick={() => {
                        addRecentSearch(inputVal);
                        setIsSearchOpen(false);
                        navigate(`/shop?search=${encodeURIComponent(inputVal)}`);
                      }}
                      className="text-xs font-bold text-[#0874C9] hover:text-[#F28C18] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All in Shop</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {results.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7FAFC] border border-transparent hover:border-[#D9E8F2] transition-all duration-200"
                      >
                        <div
                          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            addRecentSearch(inputVal);
                            setIsSearchOpen(false);
                            navigate(getProductUrl(product));
                          }}
                        >
                          <ProductImage
                            src={product.image}
                            alt={product.name}
                            product={product}
                            className="w-12 h-12 object-cover rounded-lg border border-[#D9E8F2] shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-[#102A43] truncate">
                              {product.name}
                            </h5>
                            <span className="inline-block text-[10px] font-bold text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded-full mt-0.5">
                              {product.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 pl-4">
                          <span className="text-sm font-bold text-[#102A43]">
                            ${product.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              addToCart(product, 1);
                              setIsSearchOpen(false);
                            }}
                            className="bg-[#0874C9] hover:bg-[#F28C18] text-white p-2 rounded-lg transition-colors cursor-pointer"
                            aria-label="Add to cart"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
