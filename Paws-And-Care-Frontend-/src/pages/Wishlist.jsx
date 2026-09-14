import React, { useState, useEffect, useMemo } from 'react';
import WishlistHeader from '../components/wishlist/WishlistHeader';
import WishlistGrid from '../components/wishlist/WishlistGrid';
import EmptyWishlist from '../components/wishlist/EmptyWishlist';
import { wishlistApi } from '../api/wishlistApi';
import { authApi } from '../api/authApi';

export default function Wishlist({
  wishlist = [],
  onToggleWishlist,
  onAddToCart,
  onClearWishlist,
  onAddMultipleToCart,
  products = [],
  loading = false,
}) {
  const [serverHydrated, setServerHydrated] = useState(false);

  // Hydrate full wishlist data from backend if authenticated
  useEffect(() => {
    if (authApi.getSession()) {
      wishlistApi
        .getWishlist()
        .then((serverItems) => {
          if (Array.isArray(serverItems) && serverItems.length > 0) {
            try {
              const meta = JSON.parse(localStorage.getItem('paws_care_wishlist_meta') || '{}');
              let updated = false;
              serverItems.forEach((item) => {
                const prod = item.product || item;
                const idStr = String(item.productId || prod.id || prod._id || prod.sku || item.id || '');
                if (idStr && (prod.name || prod.title)) {
                  meta[idStr] = {
                    id: idStr,
                    baseProductId: idStr.split('__')[0],
                    name: prod.name || prod.title || 'Product',
                    title: prod.title || prod.name || 'Product',
                    image: prod.image || prod.images?.[0] || prod.thumbnail || '/vite.svg',
                    price: Number(prod.price || 0),
                    originalPrice: prod.originalPrice || prod.comparePrice || null,
                    rating: prod.rating || prod.avgRating || 4.8,
                    reviewCount: prod.reviewCount || 0,
                    category: prod.category?.name || prod.category || 'Pet Essentials',
                    badge: prod.badge || '',
                    slug: prod.slug || idStr,
                    inStock: prod.inStock !== false && prod.stock !== 0,
                  };
                  updated = true;
                }
              });
              if (updated) {
                localStorage.setItem('paws_care_wishlist_meta', JSON.stringify(meta));
                setServerHydrated(true);
              }
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, []);

  // Resolve actual product objects from wishlist ID list, preserving wishlist order (newest first)
  const wishlistedProducts = useMemo(() => {
    let meta = {};
    try {
      meta = JSON.parse(localStorage.getItem('paws_care_wishlist_meta') || '{}');
    } catch {
      meta = {};
    }

    return wishlist
      .map((rawId) => {
        const idStr = String(rawId);
        const isVariant = idStr.includes('__');
        const baseId = isVariant ? idStr.split('__')[0] : idStr;

        const baseProduct = products.find((p) => {
          const pId = String(p.id || '');
          const pProdId = String(p.productId || '');
          const pMongoId = String(p._id || '');
          const pSlug = String(p.slug || '');
          return pId === baseId || pProdId === baseId || pMongoId === baseId || pSlug === baseId;
        });

        const itemMeta = meta[idStr] || meta[baseId];

        if (baseProduct) {
          return {
            ...baseProduct,
            ...(itemMeta || {}),
            id: idStr,
            baseProductId: baseId,
            name: itemMeta?.name || itemMeta?.title || baseProduct.name,
            title: itemMeta?.title || itemMeta?.name || baseProduct.title || baseProduct.name,
            price: itemMeta?.price !== undefined ? itemMeta.price : baseProduct.price,
            image: itemMeta?.image || baseProduct.image,
            slug: baseProduct.slug || itemMeta?.slug || baseId,
            inStock: baseProduct.inStock !== undefined ? baseProduct.inStock : true,
          };
        }

        if (itemMeta) {
          return {
            ...itemMeta,
            id: idStr,
            baseProductId: baseId,
            name: itemMeta.name || itemMeta.title || 'Product',
            title: itemMeta.title || itemMeta.name || 'Product',
            slug: itemMeta.slug || baseId,
            inStock: itemMeta.inStock !== undefined ? itemMeta.inStock : true,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [products, wishlist, serverHydrated]);

  // Handle adding all items in wishlist to the cart
  const handleAddAllToCart = () => {
    if (wishlistedProducts.length === 0) return;

    const totalQtyToAdd = wishlistedProducts.length;

    if (onAddMultipleToCart) {
      onAddMultipleToCart(totalQtyToAdd);
    } else if (onAddToCart) {
      wishlistedProducts.forEach((p) => {
        onAddToCart(p, 1);
      });
    }
  };

  const handleClearWishlist = () => {
    try {
      localStorage.removeItem('paws_care_wishlist_meta');
    } catch {}
    if (onClearWishlist) {
      onClearWishlist();
    } else {
      wishlist.forEach((id) => {
        onToggleWishlist(id);
      });
    }
  };

  const displayCount = wishlistedProducts.length > 0 ? wishlistedProducts.length : (loading ? wishlist.length : 0);

  return (
    <div className="bg-brand-bg min-h-[80vh] pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-6">
        {/* Wishlist Header with inline action buttons */}
        <WishlistHeader
          itemCount={displayCount}
          onClearWishlist={handleClearWishlist}
          onAddAllToCart={handleAddAllToCart}
        />

        {loading && wishlist.length > 0 && wishlistedProducts.length === 0 ? (
          /* Loading Skeleton State */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
            {Array.from({ length: wishlist.length || 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-brand-surface rounded-[2rem] border border-brand-border/60 p-4 h-[430px] animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-brand-bg rounded-2xl mb-4" />
                <div className="space-y-2 px-1">
                  <div className="h-3 bg-brand-bg rounded w-1/4" />
                  <div className="h-4 bg-brand-bg rounded w-3/4" />
                  <div className="h-3 bg-brand-bg rounded w-1/2" />
                  <div className="h-5 bg-brand-bg rounded w-1/3 mt-2" />
                </div>
                <div className="h-9 bg-brand-bg rounded-lg mt-4" />
              </div>
            ))}
          </div>
        ) : wishlistedProducts.length > 0 ? (
          /* Product Grid — directly below header, no action bar gap */
          <WishlistGrid
            products={wishlistedProducts}
            onRemove={onToggleWishlist}
            onAddToCart={onAddToCart}
          />
        ) : (
          /* Empty state view */
          <EmptyWishlist />
        )}
      </div>
    </div>
  );
}
