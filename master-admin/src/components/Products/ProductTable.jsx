import { useState } from 'react'
import { 
  Plus, ImageIcon, Eye, Edit2, Trash2, RefreshCw, Upload
} from 'lucide-react'
import DeleteModal from '../common/DeleteModal'
import { useNavigate } from 'react-router-dom'
import Table from '../common/Table'
import ExportButtons from '../common/ExportButtons'
import StatusSelect from '../common/StatusSelect'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import ProductForm from './ProductForm'
import { useProducts } from '../../context/ProductContext'
import { adminApi, isSuperAdmin } from '../../lib/api'
import { showToast } from '../../lib/toast'

export default function ProductTable() {
  const { products, loading, error, reloadProducts, deleteProduct, updateProduct } = useProducts()
  const readOnly = isSuperAdmin()
  const navigate = useNavigate()
  const [editingProduct, setEditingProduct] = useState(null)
  const [isDeleting, setIsDeleting] = useState(null)
  const [exportRows, setExportRows] = useState([])

  const handleEditProduct = async (row) => {
    try {
      const product = await adminApi.product(row.id)
      setEditingProduct({
        ...row,
        ...product,
        category: product.category?.name || product.category || row.category || "",
        categoryId: product.categoryId || row.categoryId || "",
      })
    } catch (error) {
      console.error('Failed to load complete product details', error)
      setEditingProduct(row)
    }
  }

  const PRODUCT_EXPORT_COLUMNS = [
    ...(readOnly ? [{ key: 'storeName', label: 'Store' }] : []),
    { key: 'displayId', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Category' },
    { key: 'variantSummary', label: 'Variants', render: (_, row) => {
      const optionVariants = row.optionVariants || []
      const colorVariants = row.colorVariants || []
      if (optionVariants.length) return `${optionVariants.length} option${optionVariants.length > 1 ? 's' : ''}`
      return colorVariants.length ? `${colorVariants.length} color${colorVariants.length > 1 ? 's' : ''}` : ''
    } },
    { key: 'mrp', label: 'MRP' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'sold', label: 'Sold' },
    { key: 'status', label: 'Status', render: (value, row) => Number(row.stock || 0) <= 0 ? 'out_of_stock' : value },
  ]

  const handleDelete = async () => {
    const id = isDeleting
    setIsDeleting(null)
    await deleteProduct(id)
  }

  const handleEditSubmit = async (updatedData) => {
    try {
      await updateProduct(editingProduct.id, updatedData)
      setEditingProduct(null)
      showToast({
        type: 'success',
        title: 'Product updated',
        message: 'Product price and variant details saved successfully.',
      })
      reloadProducts().catch((error) => {
        console.error('Failed to refresh products after update', error)
      })
    } catch (error) {
      console.error('Failed to update product', error)
      showToast({
        type: 'error',
        title: 'Product not saved',
        message: error.message || 'Unable to update product. Please check the product details and try again.',
      })
      error.toastShown = true
      throw error
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateProduct(id, { status: newStatus })
      await reloadProducts()
      showToast({
        type: 'success',
        title: 'Status updated',
        message: 'Product status saved successfully.',
      })
    } catch (error) {
      console.error('Failed to update product status', error)
      const msg = error?.response?.data?.message || error?.message || 'Unable to update product status.'
      showToast({
        type: 'error',
        title: newStatus === 'active' ? 'Cannot activate product' : 'Status not saved',
        message: msg,
      })
    }
  }

  const columns = [
    { 
      key: 'imagePreview',
      label: 'Img', 
      render: (_, row) => {
        const variants = row.colorVariants || []
        return (
        <div className="flex items-center gap-1.5">
          {(variants || []).slice(0, 3).map((variant) => (
            <div
              key={variant.id || variant.label}
              className="h-9 w-9 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 shadow-sm"
              title={variant.label}
            >
              {variant.mainImage ? (
                <img src={variant.mainImage} alt={variant.label || 'Variant'} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ backgroundColor: variant.color || '#f3f4f6' }} />
              )}
            </div>
          ))}
          {(!variants || variants.length === 0) && (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
              {(row.mainImage || row.image || row.optionVariants?.[0]?.image || row.optionVariants?.[0]?.mainImage) ? (
                <img src={row.mainImage || row.image || row.optionVariants?.[0]?.image || row.optionVariants?.[0]?.mainImage} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={16} className="text-gray-300" />
              )}
            </div>
          )}
          {variants?.length > 3 && (
            <span className="text-[10px] font-bold text-gray-500">+{variants.length - 3}</span>
          )}
        </div>
        )
      }
    },
    ...(readOnly ? [{ key: 'storeName', label: 'Store', className: 'hidden xl:table-cell', render: v => <span className="font-semibold text-gray-700">{v || '-'}</span> }] : []),
    { key: 'displayId', label: 'ID', className: 'hidden xl:table-cell' },
    { key: 'name', label: 'Product Name', render: v => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'sku', label: 'SKU', className: 'hidden 2xl:table-cell', render: v => <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{v}</code> },
    { key: 'category', label: 'Category', className: 'hidden md:table-cell' },
    { key: 'variantSummary', label: 'Variants', className: 'hidden lg:table-cell', render: (_, row) => {
      const optionVariants = row.optionVariants || []
      const variants = row.colorVariants || []
      if (optionVariants.length) return `${optionVariants.length} option${optionVariants.length > 1 ? 's' : ''}`
      return variants.length ? `${variants.length} color${variants.length > 1 ? 's' : ''}` : '—'
    } },
    { key: 'mrp', label: 'MRP', className: 'hidden lg:table-cell', render: v => v != null ? <span className="line-through text-gray-400">${v.toLocaleString()}</span> : '—' },
    { key: 'price', label: 'Price', render: v => v != null ? <span className="font-semibold text-green-700">${v.toLocaleString()}</span> : '—' },
    { key: 'stock', label: 'Stock', className: 'hidden sm:table-cell', render: v => v != null ? <span className={`font-semibold ${v === 0 ? 'text-red-600' : 'text-gray-800'}`}>{v}</span> : '—' },
    { key: 'sold', label: 'Sold', className: 'hidden xl:table-cell', render: v => v != null ? <span>{v}</span> : '—' },
    { 
      key: 'status', 
      label: 'Status', 
      render: (v, row) => (
        readOnly ? (
          <StatusBadge status={Number(row.stock || 0) <= 0 ? 'out_of_stock' : v} />
        ) : (
          <StatusSelect
            status={Number(row.stock || 0) <= 0 ? 'out_of_stock' : v}
            options={['active', 'inactive', 'out_of_stock']}
            onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
          />
        )
      )
    },
    {
      key: 'id', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/products/view/${row.id}`)} 
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {!readOnly && (
            <>
              <button
                onClick={() => handleEditProduct(row)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                title="Edit Product"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setIsDeleting(row.id)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                title="Delete Product"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <>
      <Table
        title="Product List"
        data={products}
        columns={columns}
        searchKey="name"
        onFilteredChange={setExportRows}
        actions={
          <>
            <ExportButtons data={exportRows} columns={PRODUCT_EXPORT_COLUMNS} filenamePrefix="products" disabled={loading} />
            <button
              onClick={reloadProducts}
              disabled={loading}
              className="flex items-center gap-2 border text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-opacity disabled:opacity-60"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {!readOnly && (
              <>
                {/* <button
                  onClick={() => navigate('/products/bulk-import')}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--primary)' }}>
                  <Upload size={13} /> Bulk Import
                </button> */}
                <button
                  onClick={() => navigate('/products/add')}
                  className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--primary)' }}>
                  <Plus size={13} /> Add Product
                </button>
              </>
            )}
          </>
        }
        emptyMessage={loading ? 'Loading products...' : error || 'No records found'}
      />
      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title="Edit Product" width="max-w-4xl">
        {editingProduct && (
          <ProductForm initialData={editingProduct} onSubmit={handleEditSubmit} />
        )}
      </Modal>

      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </>
  )
}
