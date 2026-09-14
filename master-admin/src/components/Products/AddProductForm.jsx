import { useEffect, useRef, useState } from 'react'
import { Upload, X, ChevronDown, Check, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { categories } from '../../data/dummyData'
import { uploadApi } from '../../api/uploadApi'
import { categoryApi } from '../../api/categoryApi'
import { getAdminToken } from '../../lib/api'
import {
  showValidationError,
} from '../../utils/formValidation'

const optionTypes = {
  size: {
    label: 'Size',
    helper: 'For belts, clothes, beds, houses and accessories.',
    placeholder: 'XS, S, M, L, XL or Small, Medium, Large',
  },
  weight: {
    label: 'Weight',
    helper: 'For food, treats and dry goods.',
    placeholder: '100 g, 250 g, 1 kg, 5 kg',
  },
  volume: {
    label: 'Volume',
    helper: 'For liquid products, shampoo, medicine and sprays.',
    placeholder: '50 ml, 100 ml, 1 L',
  },
  length: {
    label: 'Length',
    helper: 'For leashes, belts, ropes and measured accessories.',
    placeholder: '30 cm, 60 cm, 1 m',
  },
  custom: {
    label: 'Option',
    helper: 'For any product-specific option.',
    placeholder: 'Pack of 2, Puppy, Adult',
  },
}

const getOptionLabel = (optionType) => optionTypes[optionType]?.label || optionTypes.size.label
const petTypeOptions = ['Dog', 'Cat', 'Mouse', 'Horse', 'Bird', 'Fish', 'Rabbit', 'Other']
const fieldErrorClass = 'text-xs font-semibold text-red-600'
const errorInputClass = 'ring-2 ring-red-100'

const isBlank = (value) => String(value ?? '').trim().length === 0
const cleanNumberValue = (value) => {
  if (value === undefined || value === null) return ''
  return value
}
const getVariantDerivedValues = (variants = []) => {
  const activeVariant = variants.find(variant => String(variant.status || 'Active').toLowerCase() === 'active')
  const primaryVariant = activeVariant || variants[0] || null
  const stock = variants.reduce((total, variant) => {
    if (String(variant.status || 'Active').toLowerCase() !== 'active') return total
    const quantity = Number(variant.stock)
    return total + (Number.isFinite(quantity) ? quantity : 0)
  }, 0)

  return {
    price: primaryVariant ? Number(primaryVariant.price) : 0,
    salePrice: primaryVariant ? Number(primaryVariant.regularPrice) : 0,
    stock,
  }
}
const getBackendErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (Array.isArray(error?.response?.data?.errors)
    ? error.response.data.errors
        .map((item) => item.message || item.msg || item)
        .filter(Boolean)
        .join(', ')
    : '') ||
  error?.message ||
  'Unable to create product. Please check the form and try again.'

const getProductValidationErrors = ({ formData, hasVariants, colorVariants }) => {
  const errors = {}

  if (isBlank(formData.name)) errors.name = 'Product title is required.'
  if (!formData.categoryId && isBlank(formData.category)) errors.category = 'Category is required.'
  if (isBlank(formData.petType)) errors.petType = 'Pet type is required.'
  if (isBlank(formData.sku)) errors.sku = 'Product SKU is required.'
  if (hasVariants && colorVariants.length === 0) {
    errors.variants = 'Add at least one color variant or disable color variants mode.'
  }
  if (!hasVariants && !formData.mainImageFile) {
    errors.mainImage = 'Main product image is required.'
  }

  return errors
}

const FieldError = ({ message }) =>
  message ? <p className={fieldErrorClass}>{message}</p> : null

export default function AddProductForm({ onSubmit }) {
  const navigate = useNavigate()
  const fallbackCategories = categories.filter(cat => String(cat.status).toLowerCase() === 'active')
  const [isUploading, setIsUploading] = useState(false)
  const [hasVariants, setHasVariants] = useState(false)
  const [activeCategories, setActiveCategories] = useState(fallbackCategories)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shippingReturns: '',
    returnPolicies: '',
    category: fallbackCategories[0]?.name || '',
    categoryId: fallbackCategories[0]?.id || null,
    petType: 'Dog',
    mrp: '',
    price: '',
    sku: '',
    stock: '',
    status: 'active',
    optionType: 'size',
    optionLabel: 'Size',
    capacities: '',
    mainImage: null,
    gallery: [],
    prescriptionRequired: false,
    vetOnly: false
  })

  // Color Variant Management
  const [colorVariants, setColorVariants] = useState([])
  const [optionVariants, setOptionVariants] = useState([])
  const [currentVariant, setCurrentVariant] = useState({
    label: '',
    color: '#FFFFFF',
    mainImage: null,
    gallery: []
  })

  const [activeTab, setActiveTab] = useState('shippingReturns')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  
  const formMainImageRef = useRef(null)
  const formGalleryRef = useRef(null)
  const variantMainImageRef = useRef(null)
  const variantGalleryRef = useRef(null)

  useEffect(() => {
    const loadActiveCategories = async () => {
      if (!getAdminToken()) return

      try {
        const apiCategories = await categoryApi.getAllCategories({ status: 'Active' })
        const activeOnly = apiCategories.filter(cat => String(cat.status).toLowerCase() === 'active')
        setActiveCategories(activeOnly)

        if (activeOnly.length > 0) {
          setFormData(prev => {
            const selectedStillActive = activeOnly.some(cat => cat.id === prev.categoryId)
            if (selectedStillActive) return prev

            return {
              ...prev,
              category: activeOnly[0].name,
              categoryId: activeOnly[0].id,
            }
          })
        }
      } catch (error) {
        console.error('Unable to load active categories:', error)
      }
    }

    loadActiveCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormError('')
    setFieldErrors(prev => ({ ...prev, [name]: undefined }))
    if (name === 'optionType') {
      setFormData(prev => ({
        ...prev,
        optionType: value,
        optionLabel: getOptionLabel(value),
      }))
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const capacityLabels = formData.capacities
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const makeOptionVariant = (label, index, source = {}) => ({
    id: source.id || `${label}-${Date.now()}-${index}`,
    label,
    sku: source.sku ?? '',
    price: cleanNumberValue(source.price),
    regularPrice: cleanNumberValue(source.regularPrice ?? source.mrp ?? source.salePrice),
    stock: cleanNumberValue(source.stock),
    status: source.status || 'Active',
  })

  const syncOptionVariants = () => {
    setOptionVariants(current =>
      capacityLabels.map((label, index) => {
        const existing = current.find(variant => variant.label === label)
        return makeOptionVariant(label, index, existing)
      }),
    )
  }

  useEffect(() => {
    if (capacityLabels.length === 0) {
      setOptionVariants([])
      return
    }
    syncOptionVariants()
  }, [formData.capacities])

  const updateOptionVariant = (label, field, value) => {
    setFormError('')
    setFieldErrors(prev => ({ ...prev, optionVariants: undefined }))
    setOptionVariants(current =>
      capacityLabels.map((currentLabel, index) => {
        const existing = current.find(variant => variant.label === currentLabel)
        const nextVariant = makeOptionVariant(currentLabel, index, existing)
        return currentLabel === label ? { ...nextVariant, [field]: value } : nextVariant
      }),
    )
  }

  const getVisibleOptionVariants = () =>
    capacityLabels.map((label, index) => {
      const existing = optionVariants.find(variant => variant.label === label)
      return makeOptionVariant(label, index, existing)
    })

  const getOptionVariantValidationError = (variants) => {
    const duplicateOption = capacityLabels.find(
      (label, index) => capacityLabels.findIndex(item => item.toLowerCase() === label.toLowerCase()) !== index,
    )
    if (duplicateOption) return `Duplicate variant option "${duplicateOption}" is not allowed.`

    const incompleteVariant = variants.find(
      variant => isBlank(variant.price) || isBlank(variant.regularPrice) || isBlank(variant.stock),
    )
    if (incompleteVariant) {
      return `${incompleteVariant.label} variant requires Selling Price, MRP, and Stock.`
    }

    const invalidPriceVariant = variants.find((variant) => {
      const price = Number(variant.price)
      const mrp = Number(variant.regularPrice)
      const stock = Number(variant.stock)
      return (
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isFinite(mrp) ||
        mrp <= 0 ||
        price > mrp ||
        !Number.isInteger(stock) ||
        stock < 0
      )
    })
    if (invalidPriceVariant) {
      return `${invalidPriceVariant.label} variant has invalid price, MRP, or stock.`
    }

    return ''
  }

  const handleCategoryChange = (e) => {
    const selected = activeCategories.find(cat => cat.id === e.target.value)
    setFormError('')
    setFieldErrors(prev => ({ ...prev, category: undefined }))
    setFormData(prev => ({
      ...prev,
      category: selected?.name || '',
      categoryId: selected?.id || null,
    }))
  }

  // Global Image Handling (Non-variant mode)
  const handleGlobalMainImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormError('')
      setFieldErrors(prev => ({ ...prev, mainImage: undefined }))
      setFormData(prev => ({ ...prev, mainImage: URL.createObjectURL(file), mainImageFile: file }))  
    }
  }

  const handleGlobalGallery = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    const newImages = files.map(file => URL.createObjectURL(file))
    setFormData(prev => ({ 
      ...prev, 
      gallery: [...prev.gallery, ...newImages].slice(0, 5),
      galleryFiles: [...(prev.galleryFiles || []), ...files].slice(0, 5)
    }))
  }

  // Variant Management
  const handleVariantMainImage = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCurrentVariant(prev => ({ ...prev, mainImage: URL.createObjectURL(file), mainImageFile: file }))
    }
  }

  const handleVariantGallery = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    const newImages = files.map(file => URL.createObjectURL(file))
    setCurrentVariant(prev => ({ 
      ...prev, 
      gallery: [...prev.gallery, ...newImages].slice(0, 5),
      galleryFiles: [...(prev.galleryFiles || []), ...files].slice(0, 5)
    }))
  }

  const removeVariantGalleryImage = (idx) => {
    setCurrentVariant(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx),
      galleryFiles: (prev.galleryFiles || []).filter((_, i) => i !== idx)
    }))
  }

  const addColorVariant = () => {
    if (!currentVariant.label || !currentVariant.mainImage) {
      showValidationError('Color name and main image are required.')
      return
    }
    setFormError('')
    setFieldErrors(prev => ({ ...prev, variants: undefined }))
    setColorVariants(prev => [...prev, { ...currentVariant, id: Date.now().toString() }])
    setCurrentVariant({
      label: '',
      color: '#FFFFFF',
      mainImage: null,
      gallery: []
    })
  }

  const removeVariant = (id) => {
    setColorVariants(prev => prev.filter(v => v.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = getProductValidationErrors({ formData, hasVariants, colorVariants })
    const visibleOptionVariants = getVisibleOptionVariants()
    const optionVariantError = visibleOptionVariants.length === 0
      ? 'Add at least one product variant option.'
      : getOptionVariantValidationError(visibleOptionVariants)
    if (optionVariantError) validationErrors.optionVariants = optionVariantError
    const errorMessages = Object.values(validationErrors).filter(Boolean)

    if (errorMessages.length > 0) {
      setFieldErrors(validationErrors)
      setFormError(errorMessages[0])
      showValidationError(errorMessages[0])
      return
    }

    setFieldErrors({})
    setFormError('')

    setIsUploading(true)

    try {
      const derivedValues = getVariantDerivedValues(visibleOptionVariants)
      const newProduct = {
        ...formData,
        mrp: derivedValues.salePrice,
        salePrice: derivedValues.salePrice,
        price: derivedValues.price,
        stock: derivedValues.stock,
        optionType: formData.optionType,
        optionLabel: formData.optionLabel || getOptionLabel(formData.optionType),
        capacities: capacityLabels,
        optionVariants: visibleOptionVariants.map(variant => ({
          ...variant,
          price: Number(variant.price),
          regularPrice: Number(variant.regularPrice),
          stock: Number(variant.stock),
        })),
      }

      if (hasVariants) {
        const uploadedVariants = await Promise.all(colorVariants.map(async (v) => {
           let mainImageUrl = v.mainImage;
           if (v.mainImageFile) {
             const res = await uploadApi.uploadImage(v.mainImageFile)
             mainImageUrl = res.data.url
           }
           let galleryUrls = v.gallery;
           if (v.galleryFiles && v.galleryFiles.length > 0) {
             const res = await uploadApi.uploadMultipleImages(v.galleryFiles)
             galleryUrls = res.data.map(img => img.url)
           }
           return { ...v, mainImage: mainImageUrl, gallery: galleryUrls }
        }))
        newProduct.colorVariants = uploadedVariants
        newProduct.mainImage = null
        newProduct.gallery = []
      } else {
        newProduct.colorVariants = []
        if (formData.mainImageFile) {
           const res = await uploadApi.uploadImage(formData.mainImageFile)
           newProduct.mainImage = res.data.url
        }
        if (formData.galleryFiles && formData.galleryFiles.length > 0) {
           const res = await uploadApi.uploadMultipleImages(formData.galleryFiles)
           newProduct.gallery = res.data.map(img => img.url)
        }
      }

      await onSubmit(newProduct)
    } catch (error) {
      console.error("Upload error:", error)
      const message = getBackendErrorMessage(error)
      setFormError(message)
      showValidationError(message)
    } finally {
      setIsUploading(false)
    }
  }

  const variantSummary = getVariantDerivedValues(getVisibleOptionVariants())

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:gap-6"
    >
      {formError && (
        <div className="2xl:col-span-2 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold">Please fix the highlighted fields.</p>
            <p className="mt-1 break-words text-sm font-medium">{formError}</p>
          </div>
        </div>
      )}

      {/* Left Column: Input Fields */}
      <div className="min-w-0 space-y-6">
        
        {/* Card 1: Product Media (Color & Images) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-5 border-b border-gray-50">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Product Media</h3>
                    <p className="text-sm text-gray-500">Enable variants if the product has different colors</p>
                </div>

                <div className="mt-4 md:mt-0 p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4 transition-all hover:bg-blue-50">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-900 leading-tight">Enable Color Variants</span>
                        <span className="text-[10px] text-blue-600 font-medium tracking-tight">Support multiple color sets</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={hasVariants}
                            onChange={(e) => setHasVariants(e.target.checked)}
                            className="sr-only peer" 
                        />
                        <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            <div className="mb-6 p-3 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-900 leading-tight">Prescription Required</span>
                    <span className="text-[10px] text-amber-600 font-medium tracking-tight">Customers must upload a prescription at checkout</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                        type="checkbox"
                        checked={formData.prescriptionRequired}
                        onChange={(e) => setFormData(prev => ({ ...prev, prescriptionRequired: e.target.checked }))}
                        className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
            </div>

            <div className="mb-6 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-900 leading-tight">Vet Only Product</span>
                    <span className="text-[10px] text-emerald-700 font-medium tracking-tight">Only verified veterinarians can purchase this product</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                        type="checkbox"
                        checked={formData.vetOnly}
                        onChange={(e) => setFormData(prev => ({ ...prev, vetOnly: e.target.checked }))}
                        className="sr-only peer"
                    />
                    <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>

            {!hasVariants ? (
              /* STANDARD IMAGES SECTION */
              <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(180px,240px)_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Main Product Image *</label>
                        <div 
                          onClick={() => formMainImageRef.current?.click()}
                          className={`aspect-square rounded-2xl border-2 border-dashed bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-all overflow-hidden group ${
                            fieldErrors.mainImage ? 'border-red-300' : 'border-gray-100'
                          }`}
                        >
                            <input type="file" ref={formMainImageRef} onChange={handleGlobalMainImage} className="hidden" accept="image/*" />
                            {formData.mainImage ? (
                              <img src={formData.mainImage} className="w-full h-full object-contain p-4" />
                            ) : (
                              <>
                                <Upload size={24} className="text-gray-400 mb-2 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-semibold text-gray-500 uppercase group-hover:text-primary transition-colors">Upload</span>
                              </>
                            )}
                        </div>
                        <FieldError message={fieldErrors.mainImage} />
                      </div>

                      <div className="min-w-0 space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gallery (Up to 5)</label>
                        <div className="flex flex-wrap gap-3">
                            {formData.gallery.map((img, i) => (
                              <div key={i} className="w-24 h-24 rounded-2xl border border-gray-100 relative group overflow-hidden shadow-sm">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <button 
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i), galleryFiles: (p.galleryFiles || []).filter((_, idx) => idx !== i) }))}
                                    className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                    <X size={10} />
                                 </button>
                              </div>
                            ))}
                            {formData.gallery.length < 5 && (
                              <button 
                                type="button"
                                onClick={() => formGalleryRef.current?.click()}
                                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all bg-gray-50/30"
                              >
                                <input type="file" ref={formGalleryRef} multiple onChange={handleGlobalGallery} className="hidden" accept="image/*" />
                                <Plus size={24} />
                              </button>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">Add more perspectives of the product.</p>
                      </div>
                  </div>
              </div>
            ) : (
              /* COLOR VARIANTS SECTION */
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Add New Color Variant Form */}
                <div className="p-6 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/30 mb-8">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-blue-600" />
                    New Color Variant Setup
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="min-w-0 space-y-1.5">
                        <label className="text-xs font-bold text-gray-600">Color Name *</label>
                        <input 
                          type="text" 
                          value={currentVariant.label}
                          onChange={(e) => setCurrentVariant(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g. Alpine White, Jet Black"
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600">Color Palette</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={currentVariant.color}
                            onChange={(e) => setCurrentVariant(prev => ({ ...prev, color: e.target.value }))}
                            className="w-12 h-10 p-1 rounded-lg border border-gray-200 bg-white cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={currentVariant.color}
                            onChange={(e) => setCurrentVariant(prev => ({ ...prev, color: e.target.value }))}
                            className="min-w-0 flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono uppercase"
                            placeholder="#FFFFFF"
                          />
                        </div>
                    </div>
                  </div>

                  {/* Main Image Upload */}
                  <div className="space-y-1.5 mb-6">
                    <label className="text-xs font-bold text-gray-600">Main Image for this color *</label>
                    <div 
                      onClick={() => variantMainImageRef.current?.click()}
                      className="w-full h-48 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-primary hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col items-center justify-center group overflow-hidden"
                    >
                        <input 
                          type="file" 
                          ref={variantMainImageRef}
                          onChange={handleVariantMainImage}
                          className="hidden" 
                          accept="image/*"
                        />
                        {currentVariant.mainImage ? (
                          <img src={currentVariant.mainImage} className="w-full h-full object-contain p-4" />
                        ) : (
                          <>
                            <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors mb-2">
                              <Upload size={24} />
                            </div>
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Upload Color Main</span>
                            <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                          </>
                        )}
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div className="space-y-1.5 mb-8">
                    <label className="text-xs font-bold text-gray-600">Variant Gallery (Max 5)</label>
                    <div className="flex flex-wrap gap-3">
                        {currentVariant.gallery.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white group/img shadow-sm">
                            <img src={img} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removeVariantGalleryImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                            >
                                <X size={10} />
                            </button>
                          </div>
                        ))}
                        {currentVariant.gallery.length < 5 && (
                          <button 
                            type="button"
                            onClick={() => variantGalleryRef.current?.click()}
                            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-white hover:border-primary hover:text-primary transition-all flex items-center justify-center text-gray-400"
                          >
                            <input 
                              type="file" 
                              multiple 
                              ref={variantGalleryRef}
                              onChange={handleVariantGallery}
                              className="hidden" 
                              accept="image/*"
                            />
                            <Plus size={24} />
                          </button>
                        )}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={addColorVariant}
                    className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Plus size={20} /> Add Color Variant
                  </button>
                </div>

                {/* Added Variants List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-600 rounded-full" />
                      Current Variants ({colorVariants.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {colorVariants.map((variant) => (
                          <div
                            key={variant.id}
                            className="p-4 rounded-2xl border border-gray-100 shadow-sm bg-white relative flex gap-4 transition-all hover:border-blue-100 group"
                          >
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-50 shrink-0 bg-gray-50">
                                <img src={variant.mainImage} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2.5 h-2.5 rounded-full border border-gray-100" style={{ backgroundColor: variant.color }}></div>
                                  <h5 className="text-sm font-bold text-gray-800">{variant.label}</h5>
                                </div>
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{variant.color}</p>
                                <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-tighter">{variant.gallery.length + 1} TOTAL IMAGES</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeVariant(variant.id)}
                              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                  </div>
                  {colorVariants.length === 0 && (
                    <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No color variants added yet</p>
                    </div>
                  )}
                  <FieldError message={fieldErrors.variants} />
                </div>
              </div>
            )}
        </div>

        {/* Card 2: Product Name & Details */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8">
           <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-50">General Information</h3>
            
            <section className="space-y-8">
            
            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Title *</label>
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Classic Cotton Hoodie"
                className={`w-full px-5 py-3 bg-gray-50/80 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400 ${
                  fieldErrors.name ? errorInputClass : ''
                }`}
              />
              <FieldError message={fieldErrors.name} />
            </div>

            {/* Product Details Tabs (Description, etc) */}
            <div className="space-y-4">
              <div className="flex gap-4 sm:gap-8 border-b border-gray-100 overflow-x-auto">
                {[
                  { id: 'shippingReturns', label: 'Shipping' },
                  { id: 'returnPolicies', label: 'Returns' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-xs font-semibold uppercase tracking-widest relative transition-colors whitespace-nowrap ${
                      activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea 
                  name={activeTab}
                  value={formData[activeTab]}
                  onChange={handleChange}
                  placeholder={`Provide detailed information about ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
                  rows={4}
                  className="w-full px-5 py-4 bg-gray-50/80 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400 resize-none"
                />
              </div>
            </div>

            {/* Category & Pet Type */}
            <div className="grid grid-cols-1 gap-6 pb-6 border-b border-gray-50 xl:grid-cols-2">
              <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category *</label>
                  <div className="relative">
                    <select 
                      name="categoryId"
                      value={formData.categoryId || ''}
                      onChange={handleCategoryChange}
                      className={`w-full px-5 py-3.5 bg-gray-50/80 border-none rounded-2xl text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-100 cursor-pointer ${
                        fieldErrors.category ? errorInputClass : ''
                      }`}
                    >
                      {activeCategories.length === 0 ? (
                        <option value="">No active categories</option>
                      ) : (
                        activeCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      )}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <FieldError message={fieldErrors.category} />
              </div>
              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pet Type *</label>
                  <select
                    name="petType"
                    value={formData.petType}
                    onChange={handleChange}
                    className={`w-full px-5 py-3.5 bg-gray-50/80 border-none rounded-2xl text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-100 cursor-pointer ${
                      fieldErrors.petType ? errorInputClass : ''
                    }`}
                  >
                    {petTypeOptions.map((petType) => (
                      <option key={petType} value={petType}>{petType}</option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.petType} />
              </div>
            </div>
            
            {/* Product Options */}
            <div className="grid grid-cols-1 gap-6 rounded-2xl bg-gray-50/60 p-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Option Type</label>
                  <select
                    name="optionType"
                    value={formData.optionType}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-white border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100"
                  >
                    {Object.entries(optionTypes).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {formData.optionLabel || getOptionLabel(formData.optionType)} Options
                  </label>
                  <input
                    name="capacities"
                    value={formData.capacities}
                    onChange={handleChange}
                    onBlur={syncOptionVariants}
                    placeholder={optionTypes[formData.optionType]?.placeholder || optionTypes.size.placeholder}
                    className="w-full px-5 py-3.5 bg-white border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-[10px] font-semibold text-gray-400">
                    {optionTypes[formData.optionType]?.helper || optionTypes.size.helper}
                  </p>
                </div>
                {capacityLabels.length > 0 && (
                  <div className="xl:col-span-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white">
                    <table className="min-w-[680px] w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                        <tr>
                          <th className="px-3 py-2">Variant</th>
                          <th className="px-3 py-2">Selling Price</th>
                          <th className="px-3 py-2">MRP</th>
                          <th className="px-3 py-2">Stock</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {capacityLabels.map((label) => {
                          const variant = optionVariants.find(item => item.label === label) || {}
                          return (
                            <tr key={label} className="border-t border-gray-100">
                              <td className="px-3 py-2 font-bold text-gray-700">{label}</td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={variant.price ?? ''}
                                  onChange={(event) => updateOptionVariant(label, 'price', event.target.value)}
                                  className="w-full rounded-lg border border-gray-200 px-2 py-1"
                                  placeholder="Selling price"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={variant.regularPrice ?? ''}
                                  onChange={(event) => updateOptionVariant(label, 'regularPrice', event.target.value)}
                                  className="w-full rounded-lg border border-gray-200 px-2 py-1"
                                  placeholder="MRP"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={variant.stock ?? ''}
                                  onChange={(event) => updateOptionVariant(label, 'stock', event.target.value)}
                                  className="w-full rounded-lg border border-gray-200 px-2 py-1"
                                  placeholder="Stock"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={variant.status || 'Active'}
                                  onChange={(event) => updateOptionVariant(label, 'status', event.target.value)}
                                  className="w-full rounded-lg border border-gray-200 px-2 py-1"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="xl:col-span-2">
                  <FieldError message={fieldErrors.optionVariants} />
                </div>
                <div className="xl:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Default Price</p>
                    <p className="text-sm font-bold text-gray-900">${variantSummary.price || 0}</p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Default MRP</p>
                    <p className="text-sm font-bold text-gray-900">${variantSummary.salePrice || 0}</p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Stock</p>
                    <p className="text-sm font-bold text-gray-900">{variantSummary.stock || 0}</p>
                  </div>
                </div>
            </div>

            {/* Inventory Settings */}
            <div className="grid grid-cols-1 gap-6 pt-6 mt-6 border-t border-gray-50 xl:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product SKU *</label>
                  <input 
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="SKU-HDY-001"
                    className={`w-full px-5 py-3.5 bg-gray-50/80 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-100 font-mono tracking-widest uppercase ${
                      fieldErrors.sku ? errorInputClass : ''
                    }`}
                  />
                  <FieldError message={fieldErrors.sku} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Variant Stock</label>
                  <div className="w-full px-5 py-3.5 bg-gray-50/80 rounded-2xl text-sm font-bold text-gray-800">
                    {variantSummary.stock || 0}
                  </div>
                </div>
            </div>

          </section>
        </div>
      </div>

      {/* Right Column: Preview & Submit */}
      <div className="min-w-0 space-y-4 2xl:sticky 2xl:top-6 h-fit">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Summary</h3>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8">           
           <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">PRODUCT</span>
                 <span className="text-sm font-semibold text-gray-900 text-right w-1/2 truncate">{formData.name || 'UNNAMED'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">CATEGORY</span>
                 <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{formData.category.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">PET</span>
                 <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">{formData.petType.toUpperCase()}</span>
              </div>
              
              {/* Variant Preview */}
              <div className="flex justify-between py-3 border-b border-gray-50">
                 <span className="text-sm font-bold text-gray-400">VARIANTS</span>
                 <div className="flex -space-x-2.5">
                    {hasVariants ? (
                      colorVariants.length > 0 ? (
                        colorVariants.map(v => (
                          <div 
                            key={v.id} 
                            className="w-7 h-7 rounded-full border-2 border-white shadow-md transition-transform hover:z-10 hover:scale-125 cursor-help" 
                            style={{ backgroundColor: v.color }} 
                            title={v.label}
                          />
                        ))
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-500">REQUIRED</span>
                      )
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-500">STANDARD ONLY</span>
                    )}
                 </div>
              </div>

              <div className="flex min-w-0 items-start justify-between gap-4 py-4 border-b border-gray-50">
                 <span className="shrink-0 text-sm font-bold text-gray-400">NET PRICE</span>
                 <span className="min-w-0 max-w-full text-right text-xl font-semibold text-emerald-600">
                    <span className="text-sm">$</span>
                    <span className="break-all [overflow-wrap:anywhere]">{Number(variantSummary.price || 0).toLocaleString()}</span>
                 </span>
              </div>
              <div className="flex justify-between py-3">
                 <span className="text-sm font-bold text-gray-400">STATUS</span>
                 <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full uppercase tracking-widest ring-4 ring-emerald-50">Active</span>
              </div>
           </div>

           <button 
             type="submit"
             disabled={isUploading}
             className="w-full mt-10 bg-primary text-white font-semibold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 duration-200 disabled:opacity-50"
           >
             <Check size={20} />
             {isUploading ? 'UPLOADING & CREATING...' : 'CREATE PRODUCT'}
           </button>
           <p className="text-center text-[10px] font-bold text-gray-400 mt-5 leading-relaxed">
             BY CLICKING ABOVE, THIS PRODUCT WILL BE ADDED TO YOUR CATALOG IMMEDIATELY.
           </p>
        </div>
      </div>
    </form>
  )
}
