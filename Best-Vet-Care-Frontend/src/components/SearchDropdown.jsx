import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CartIcon,
  HeartIcon,
  PawIcon,
  PillIcon,
  SearchIcon,
  TruckIcon,
  XIcon,
} from "./common/HeaderIcons";
import { productApi } from "../api/productApi";
import { mapCatalogProduct } from "../utils/catalog";

const popularSearches = [
  "Dog Food",
  "Cat Medicine",
  "Flea Treatment",
  "Dog Shampoo",
  "Cat Toys",
  "Vitamin",
];

const topCategories = [
  { label: "Dog Food", icon: PawIcon },
  { label: "Cat Food", icon: HeartIcon },
  { label: "Medicine", icon: PillIcon },
  { label: "Grooming", icon: SearchIcon },
  { label: "Toys", icon: CartIcon },
  { label: "Accessories", icon: TruckIcon },
];

const SearchDropdown = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const trimmedQuery = query.trim();
  const [searchResults, setSearchResults] = useState([]);
  
  useEffect(() => {
    if (!trimmedQuery) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      productApi.getProducts({ q: trimmedQuery, limit: 5 })
        .then((data) => {
           if (data && data.items) {
             const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
             setSearchResults(data.items.map(p => ({
               ...mapCatalogProduct(p),
               image: p.image 
                 ? (p.image.startsWith('http') ? p.image : `${baseUrl}${p.image.startsWith('/') ? '' : '/'}${p.image}`) 
                 : "/images/img_product_item_image.png",
             })));
           } else {
             setSearchResults([]);
           }
        })
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [trimmedQuery]);

  const goToSearch = (term) => {
    const nextTerm = term.trim();

    if (!nextTerm) return;

    navigate(`/products?search=${encodeURIComponent(nextTerm)}`);
    onClose();
  };

  const goToProduct = (product) => {
    const isFamilyProduct = product.productType === "FAMILY" || product.familyVariants?.length > 0;
    navigate(`${isFamilyProduct ? "/products" : "/product"}/${product.slug || product.id}`, {
      state: { product },
    });
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    goToSearch(query);
  };

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-[60] px-3 sm:px-5 lg:px-[22px]">
      <div
        ref={dropdownRef}
        className="mx-auto mt-3 max-h-[calc(100vh-170px)] w-full max-w-[360px] origin-top scale-100 overflow-y-auto rounded-2xl border border-[#17345f1a] bg-white p-4 opacity-100 shadow-[0_22px_70px_rgba(18,42,80,0.18)] transition-all duration-200 sm:max-w-[680px] sm:p-6"
        role="dialog"
        aria-modal="false"
        aria-label="Search products"
      >
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5 sm:gap-4">
          <h2 className="max-w-[250px] text-[18px] font-bold leading-tight text-[#122a50] sm:max-w-none sm:text-2xl">
            Search for products, brands or categories
          </h2>
          <button
            type="button"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[#122a50] transition-colors hover:bg-[#f8f1df]"
            onClick={onClose}
            aria-label="Close search"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form className="relative" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for food, medicine, toys, grooming..."
            className="h-11 w-full rounded-full border border-[#d9aa3d] bg-white py-3 pl-4 pr-12 text-sm font-medium text-[#122a50] outline-none transition-colors placeholder:text-[#122a50b2] focus:border-[#d9aa3d] sm:h-[52px] sm:pl-5 sm:pr-14 sm:text-base"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#d9aa3d] transition-colors hover:bg-[#f8f1df] sm:right-2 sm:h-10 sm:w-10"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </form>

        <section className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#122a50]">
              {trimmedQuery ? "Matching Products" : "Suggested Products"}
            </h3>
            {trimmedQuery && (
              <button
                type="button"
                className="text-xs font-extrabold text-[#d9aa3d] transition-colors hover:text-[#122a50]"
                onClick={() => goToSearch(trimmedQuery)}
              >
                View all
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((product) => (
                <button
                  key={product.id || product.name}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-xl border border-[#17345f1a] bg-white p-2 text-left transition-all hover:border-[#d9aa3d] hover:bg-[#fffdf7] sm:gap-3"
                  onClick={() => goToProduct(product)}
                >
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#f8f1df] sm:h-14 sm:w-14">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-[#122a50]">
                      {product.name}
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold text-[#122a50b2]">
                      {product.description}
                    </span>
                  </span>
                  <span className="text-xs font-extrabold text-[#d9aa3d] sm:text-sm">
                    ${product.price}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#17345f1a] bg-[#fffdf7] p-4 text-sm font-semibold text-[#122a50b2]">
                No products found. Try Dog Food, Royal Canin, toys, or chicken.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#122a50]">
            Popular Searches
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {popularSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => goToSearch(item)}
                className="rounded-full border border-[#17345f1a] bg-[#f8f1df] px-4 py-2 text-sm font-semibold text-[#122a50] transition-colors hover:border-[#d9aa3d] hover:bg-white hover:text-[#d9aa3d]"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-7 hidden sm:block">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#122a50]">
            Top Categories
          </h3>
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {topCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => goToSearch(category.label)}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f8f1df] text-[#d9aa3d] transition-all group-hover:bg-[#d9aa3d] group-hover:text-white sm:h-[72px] sm:w-[72px]">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="text-xs font-semibold leading-tight text-[#122a50] sm:text-sm">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SearchDropdown;
