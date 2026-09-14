import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { products as initialProducts } from '../data/dummyData'
import { adminApi, getAdminToken, isSuperAdmin } from '../lib/api'
import { filterBySelectedStore, SUPER_ADMIN_STORE_EVENT } from '../lib/superAdminStore'

const ProductContext = createContext()

const activeStock = (item = {}) => {
  if (String(item.status || 'Active').toLowerCase() === 'inactive') return 0
  const quantity = Number(item.stock ?? item.inventory?.stockQuantity)
  return Number.isFinite(quantity) ? quantity : 0
}

const validOptionTypes = new Set(['size', 'weight', 'volume', 'length', 'custom'])
const normalizeOptionType = (value) => validOptionTypes.has(value) ? value : 'size'

export const getProductTotalStock = (product = {}) => {
  const explicitProductType = String(product.productType || '').toUpperCase()
  const familyVariants = Array.isArray(product.familyVariants) ? product.familyVariants : []
  const familySkus = familyVariants.flatMap((variant) =>
    Array.isArray(variant?.skus) ? variant.skus : [],
  )
  if (explicitProductType === 'FAMILY' && familySkus.length > 0) {
    return familySkus.reduce((total, sku) => total + activeStock(sku), 0)
  }

  const optionVariants = Array.isArray(product.optionVariants) ? product.optionVariants : []
  if (optionVariants.length > 0) {
    return optionVariants.reduce((total, variant) => total + activeStock(variant), 0)
  }

  if (familySkus.length > 0) {
    return familySkus.reduce((total, sku) => total + activeStock(sku), 0)
  }

  const familyStock = familyVariants.reduce((total, variant) => total + activeStock(variant), 0)
  return familyStock > 0 ? familyStock : Number(product.stock || 0)
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const normalizeProduct = (product) => {
    const stock = getProductTotalStock(product)
    const explicitProductType = String(product.productType || '').toUpperCase()
    const familyVariants = explicitProductType === 'SIMPLE'
      ? []
      : Array.isArray(product.familyVariants) && product.familyVariants.length
      ? product.familyVariants
      : groupOptionVariantsIntoFamily(product)
    const isFamilyProduct = explicitProductType === 'FAMILY' ||
      (explicitProductType !== 'SIMPLE' && familyVariants.length > 0)

    return {
      ...product,
      storeName: product.storeName || product.store?.name || '',
      displayId: product.originalId || product.id,
      slug: product.slug || '',
      category: product.category?.name || product.category || 'Uncategorized',
      petType: product.petType || '',
      mrp: product.salePrice || product.price || 0,
      price: product.price || 0,
      stock,
      status: stock <= 0 ? 'out_of_stock' : product.status === 'Active' ? 'active' : 'inactive',
      mainImage: product.image || product.mainImage || null,
      colorVariants: product.colorVariants || [],
      optionVariants: product.optionVariants || [],
      capacities: product.capacities || [],
      optionType: normalizeOptionType(product.optionType),
      optionLabel: product.optionLabel || getDefaultOptionLabel(normalizeOptionType(product.optionType)),
      gallery: product.gallery || [],
      shippingReturns: product.shippingReturns || '',
      returnPolicies: product.returnPolicies || '',
      productType: isFamilyProduct ? 'FAMILY' : 'SIMPLE',
      parentContent: product.parentContent || '',
      productDetails: product.productDetails || {},
      familyVariants,
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      prescriptionRequired: Boolean(product.prescriptionRequired),
      vetOnly: Boolean(product.vetOnly),
    }
  }

  const toBackendProduct = (product) => {
    const stock = getProductTotalStock(product)
    const optionVariants = Array.isArray(product.optionVariants) ? product.optionVariants : []
    const resolvedStock = stock
    const shouldBeActive = resolvedStock > 0 && product.status !== 'inactive'

    return {
      name: product.name,
      slug: product.slug || '',
      categoryId: product.categoryId || null,
      category: typeof product.category === 'string' ? product.category : product.category?.name,
      petType: product.petType || null,
      description: product.description || '',
      parentContent: product.parentContent || '',
      productDetails: product.productDetails || {},
      productType: product.productType || (Array.isArray(product.familyVariants) && product.familyVariants.length ? 'FAMILY' : 'SIMPLE'),
      familyVariants: Array.isArray(product.familyVariants) ? product.familyVariants : [],
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      shippingReturns: product.shippingReturns || '',
      returnPolicies: product.returnPolicies || '',
      prescriptionRequired: Boolean(product.prescriptionRequired),
      vetOnly: Boolean(product.vetOnly),
      price: Number(product.price || 0),
      salePrice: product.mrp ? Number(product.mrp) : product.salePrice || null,
      stock: resolvedStock,
      sku: product.sku,
      status: product.status === 'inactive' ? 'Inactive' : shouldBeActive ? 'Active' : 'Active',
      image: product.mainImage || product.image || null,
      gallery: product.gallery || [],
      optionType: normalizeOptionType(product.optionType),
      optionLabel: product.optionLabel || getDefaultOptionLabel(normalizeOptionType(product.optionType)),
      capacities: Array.isArray(product.capacities) ? product.capacities : [],
      colorVariants: Array.isArray(product.colorVariants) ? product.colorVariants : [],
      optionVariants,
    }
  }

  const normalizeVariantNumber = (value) => {
    if (value === null || value === undefined || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? Number(number.toFixed(2)) : null
  }

  const variantPricesMatch = (expected = [], received = []) => {
    if (!Array.isArray(expected) || expected.length === 0) return true
    if (!Array.isArray(received) || received.length === 0) return false

    return expected.every((expectedVariant) => {
      const receivedVariant = received.find((variant) =>
        (expectedVariant.id && variant.id === expectedVariant.id) ||
        variant.label === expectedVariant.label
      )

      return (
        receivedVariant &&
        normalizeVariantNumber(receivedVariant.price) === normalizeVariantNumber(expectedVariant.price) &&
        normalizeVariantNumber(receivedVariant.regularPrice ?? receivedVariant.mrp ?? receivedVariant.salePrice) ===
          normalizeVariantNumber(expectedVariant.regularPrice ?? expectedVariant.mrp ?? expectedVariant.salePrice) &&
        normalizeVariantNumber(receivedVariant.stock) === normalizeVariantNumber(expectedVariant.stock)
      )
    })
  }

  const loadProducts = useCallback(async () => {
    if (!getAdminToken()) return
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.products()
      setProducts((isSuperAdmin() ? filterBySelectedStore(data) : data).map(normalizeProduct))
    } catch (err) {
      setError(err.message || 'Unable to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadWhenAuthenticated = () => {
      if (getAdminToken()) loadProducts()
    }

    loadWhenAuthenticated()
    window.addEventListener('admin-auth-change', loadWhenAuthenticated)
    window.addEventListener(SUPER_ADMIN_STORE_EVENT, loadWhenAuthenticated)
    window.addEventListener('focus', loadWhenAuthenticated)

    return () => {
      window.removeEventListener('admin-auth-change', loadWhenAuthenticated)
      window.removeEventListener(SUPER_ADMIN_STORE_EVENT, loadWhenAuthenticated)
      window.removeEventListener('focus', loadWhenAuthenticated)
    }
  }, [loadProducts])

  const addProduct = async (newProduct) => {
    if (isSuperAdmin()) return
    if (getAdminToken()) {
      const created = await adminApi.createProduct(toBackendProduct(newProduct))
      setProducts(prev => [normalizeProduct(created), ...prev])
      return
    }

    setProducts(prev => [{
      ...newProduct,
      id: `PROD${String(prev.length + 1).padStart(3, '0')}`,
      sold: 0,
      createdAt: new Date().toISOString()
    }, ...prev])
  }

  const updateProduct = async (id, updatedData) => {
    if (isSuperAdmin()) return null
    if (getAdminToken()) {
      const existing = products.find(p => p.id === id) || {}
      const merged = { ...existing, ...updatedData }
      const isPartialPatch = Object.keys(updatedData).every(key => ['price', 'salePrice', 'mrp', 'stock', 'status'].includes(key))
      const payload = toBackendProduct(merged)
      const shouldMarkOutOfStock = merged.status === 'out_of_stock' && Number(payload.stock || 0) <= 0
      let updated = isPartialPatch
        ? await adminApi.patchProduct(id, {
            price: merged.price,
            salePrice: merged.mrp || merged.salePrice || null,
            stock: shouldMarkOutOfStock ? 0 : payload.stock,
            status: merged.status === 'inactive' ? 'Inactive' : 'Active',
            ...(shouldMarkOutOfStock && payload.optionVariants.length > 0
              ? { optionVariants: payload.optionVariants }
              : {}),
          })
        : await adminApi.updateProduct(id, payload)

      if (
        !isPartialPatch &&
        Array.isArray(payload.optionVariants) &&
        payload.optionVariants.length > 0 &&
        !variantPricesMatch(payload.optionVariants, updated.optionVariants)
      ) {
        updated = await adminApi.patchProduct(id, {
          optionVariants: payload.optionVariants,
        })
      }

      setProducts(prev => prev.map(p => p.id === id ? normalizeProduct(updated) : p))
      return normalizeProduct(updated)
    }

    setProducts(prev => prev.map(p => p.id === id ? normalizeProduct({ ...p, ...updatedData }) : p))
  }

  const deleteProduct = async (id) => {
    if (isSuperAdmin()) return
    if (getAdminToken()) {
      await adminApi.deleteProduct(id)
    }
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProductContext.Provider value={{ products, loading, error, reloadProducts: loadProducts, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  )
}

function getDefaultOptionLabel(optionType = 'size') {
  const labels = {
    size: 'Size',
    weight: 'Weight',
    volume: 'Volume',
    length: 'Length',
    custom: 'Option',
  }
  return labels[optionType] || labels.size
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseFlatVariantParts(variant = {}) {
  const label = String(variant.label || variant.name || '').trim()
  const explicitPrimary = String(variant.familyVariantName || variant.primaryVariant || '').trim()
  const explicitPack = String(variant.packLabel || variant.pack || '').trim()
  if (explicitPrimary || explicitPack) {
    return {
      primary: explicitPrimary || String(variant.size || variant.weightRange || label).trim(),
      pack: explicitPack || String(variant.dose || variant.packSizeLabel || '').trim(),
    }
  }
  const split = label.split(/\s*(?:\/|\+|\|)\s*/).filter(Boolean)
  if (split.length >= 3) {
    return {
      primary: split.slice(0, -1).join(' / '),
      pack: split[split.length - 1],
    }
  }
  return {
    primary: String(variant.size || variant.weightRange || (split.length > 1 ? split[0] : label)).trim(),
    pack: String(variant.dose || variant.packSizeLabel || (split.length > 1 ? split.slice(1).join(' ') : '')).trim(),
  }
}

function shouldGroupOptionVariants(optionVariants = []) {
  if (optionVariants.length < 2) return false
  const groups = new Map()
  optionVariants.forEach((variant) => {
    const { primary, pack } = parseFlatVariantParts(variant)
    if (!primary || !pack) return
    const key = primary.toLowerCase()
    groups.set(key, (groups.get(key) || 0) + 1)
  })
  return groups.size > 1 && [...groups.values()].some((count) => count > 1)
}

function groupOptionVariantsIntoFamily(product = {}) {
  const optionVariants = Array.isArray(product.optionVariants) ? product.optionVariants : []
  if (product.productType !== 'FAMILY' && !shouldGroupOptionVariants(optionVariants)) return []
  const groups = new Map()
  optionVariants.forEach((variant, index) => {
    const { primary, pack } = parseFlatVariantParts(variant)
    if (!primary || !pack) return
    const key = primary.toLowerCase()
    if (!groups.has(key)) {
      groups.set(key, {
        id: variant.familyVariantId || `${product.id || 'product'}-${slugify(primary)}`,
        name: variant.familyVariantName || primary,
        displayName: primary,
        slug: variant.familyVariantSlug || slugify(primary),
        strength: variant.strength || '',
        weightRange: variant.weightRange && variant.weightRange !== primary ? variant.weightRange : '',
        packColor: variant.packColor || '',
        image: variant.image || variant.mainImage || '',
        shortDescription: variant.description || variant.details || '',
        content: variant.content || '',
        status: 'Active',
        seoTitle: '',
        seoDescription: '',
        skus: [],
      })
    }
    groups.get(key).skus.push({
      id: variant.id,
      packLabel: pack,
      sku: variant.sku || '',
      regularPrice: variant.regularPrice ?? variant.mrp ?? variant.salePrice ?? '',
      salePrice: variant.price ?? variant.sellingPrice ?? '',
      stock: variant.stock ?? '',
      status: variant.status || 'Active',
      image: variant.image || '',
    })
  })
  return [...groups.values()]
}

export function useProducts() {
  return useContext(ProductContext)
}
