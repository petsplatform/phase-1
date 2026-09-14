import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import DeleteModal from '../common/DeleteModal'
import Table from '../common/Table'
import StatusBadge from '../common/StatusBadge'
import Modal from '../common/Modal'
import { categories as initialCategories } from '../../data/dummyData'
import CategoryForm from './CategoryForm'
import { getAdminToken, isSuperAdmin } from '../../lib/api'
import { filterBySelectedStore, SUPER_ADMIN_STORE_EVENT } from '../../lib/superAdminStore'
import { showToast } from '../../lib/toast'
import { categoryApi } from '../../api/categoryApi'

export default function CategoryTable() {
  const readOnly = isSuperAdmin()
  const [data, setData] = useState(initialCategories)
  const [showAdd, setShowAdd] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [isDeleting, setIsDeleting] = useState(null)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const normalizeCategory = (category) => ({
    ...category,
    storeName: category.storeName || category.store?.name || '',
    displayId: category.originalId || category.id,
    products: category._count?.products ?? category.products ?? 0,
    slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-'),
    status: String(category.status || 'active').toLowerCase(),
  })

  const toApiPayload = (category) => ({
    name: category.name,
    description: category.description || '',
    status: category.status === 'inactive' ? 'Inactive' : 'Active',
    image: category.image || null,
    imageFile: category.imageFile || null,
  })

  const getErrorMessage = (err, fallback) =>
    err.response?.data?.message ||
    err.response?.data?.error ||
    (Array.isArray(err.response?.data?.errors)
      ? err.response.data.errors.map((item) => item.message || item.msg || item).filter(Boolean).join(', ')
      : '') ||
    err.message ||
    fallback

  useEffect(() => {
    const loadCategories = async () => {
      if (!getAdminToken()) return
      try {
        const categories = await categoryApi.getAllCategories()
        setData((readOnly ? filterBySelectedStore(categories) : categories).map(normalizeCategory))
      } catch (err) {
        setError(err.message || 'Unable to load categories')
      }
    }

    loadCategories()
    window.addEventListener(SUPER_ADMIN_STORE_EVENT, loadCategories)
    return () => window.removeEventListener(SUPER_ADMIN_STORE_EVENT, loadCategories)
  }, [readOnly])

  const handleDelete = async () => {
    if (getAdminToken()) {
      await categoryApi.deleteCategory(isDeleting)
    }
    setData(prev => prev.filter(cat => cat.id !== isDeleting))
    setIsDeleting(null)
  }

  const handleAddSubmit = async (newCat) => {
    setFormError('')
    setSubmitting(true)
    try {
      if (getAdminToken()) {
        const created = await categoryApi.createCategory(toApiPayload(newCat))
        setData(prev => [normalizeCategory(created), ...prev])
        setShowAdd(false)
        return
      }

      const catWithId = {
        ...newCat,
        id: `CAT${String(data.length + 1).padStart(3, '0')}`,
        products: 0,
      }
      setData([catWithId, ...data])
      setShowAdd(false)
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to add category')
      setFormError(message)
      showToast({ type: 'error', title: 'Category not saved', message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (updatedCat) => {
    setFormError('')
    setSubmitting(true)
    try {
      if (getAdminToken()) {
        const updated = await categoryApi.updateCategory(editingCategory.id, toApiPayload(updatedCat))
        setData(prev => prev.map(cat => cat.id === editingCategory.id ? normalizeCategory(updated) : cat))
        setEditingCategory(null)
        return
      }

      setData(prev => prev.map(cat => (
        cat.id === editingCategory.id ? normalizeCategory({ ...cat, ...updatedCat }) : cat
      )))
      setEditingCategory(null)
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to update category')
      setFormError(message)
      showToast({ type: 'error', title: 'Category not saved', message })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    ...(readOnly ? [{ key: 'storeName', label: 'Store', render: v => <span className="font-semibold text-gray-700">{v || '-'}</span> }] : []),
    { key: 'displayId', label: 'ID' },
    {
      key: 'image',
      label: 'Image',
      render: (value, row) => value ? (
        <div className="h-10 w-14 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
          <img src={value} alt={row.name || 'Category'} className="h-full w-full object-cover" />
        </div>
      ) : '---'
    },
    { key: 'name', label: 'Category Name', render: v => <span className="font-semibold text-gray-800">{v || '—'}</span> },
    { key: 'slug', label: 'Slug', render: v => v ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{v}</code> : '—' },
    { key: 'description', label: 'Description' },
    { key: 'products', label: 'Products', render: v => <span className="font-bold text-blue-700">{v ?? 0}</span> },
    { key: 'status', label: 'Status', render: v => v ? <StatusBadge status={v} /> : '—' },
    !readOnly && {
      key: 'id', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setEditingCategory(row)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
            title="Edit Category"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => setIsDeleting(row.id)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete Category"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ].filter(Boolean)

  return (
    <>
      <Table
        title="Product Categories"
        data={data}
        columns={columns}
        searchKey="name"
        actions={!readOnly &&
          <button 
            onClick={() => {
              setFormError('')
              setShowAdd(true)
            }}
            className="flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Add Category
          </button>
        }
      />
      {error && <p className="mt-3 text-xs font-medium text-red-500">{error}</p>}
      <Modal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false)
          setFormError('')
        }}
        title="Add New Category"
      >
        <CategoryForm onSubmit={handleAddSubmit} error={formError} submitting={submitting} />
      </Modal>

      <Modal
        isOpen={!!editingCategory}
        onClose={() => {
          setEditingCategory(null)
          setFormError('')
        }}
        title="Edit Category"
      >
        {editingCategory && (
          <CategoryForm initialData={editingCategory} onSubmit={handleEditSubmit} error={formError} submitting={submitting} />
        )}
      </Modal>

      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action will affect any products currently assigned to it."
      />
    </>
  )
}
