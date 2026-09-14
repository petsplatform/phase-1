import { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { validateRequiredFields } from '../../utils/formValidation'

export default function CategoryForm({ onSubmit, initialData = null, error = '', submitting = false }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    slug: '',
    description: '',
    status: 'active',
    image: ''
  })
  const [preview, setPreview] = useState(initialData?.image || '')
  const [imageFile, setImageFile] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateRequiredFields([
      { label: 'Category name', value: formData.name },
      { label: 'Slug', value: formData.slug },
      { label: 'Category image', value: imageFile || formData.image },
      { label: 'Status', value: formData.status },
    ])) return
    await onSubmit({ ...formData, imageFile })
  }

  const handleNameChange = (e) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-')
    }))
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setPreview('')
    setFormData(prev => ({ ...prev, image: '' }))
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Category Name</label>
        <input required value={formData.name} onChange={handleNameChange} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="e.g. Water Filters" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Slug</label>
        <input required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 font-mono text-gray-500 bg-gray-50" style={{ borderColor: 'var(--border-color)' }} placeholder="water-filters" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
        <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }} placeholder="Brief category description..." />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Category Image</label>
        <label
          className="relative flex min-h-[132px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-white transition hover:bg-gray-50"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {preview ? (
            <>
              <img src={preview} alt="Category preview" className="h-[132px] w-full object-cover" />
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  clearImage()
                }}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white text-gray-600 shadow hover:text-red-600"
                aria-label="Remove category image"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <span className="flex flex-col items-center gap-2 text-center text-sm font-semibold text-gray-500">
              <span className="grid size-11 place-items-center rounded-full bg-gray-100 text-gray-500">
                <ImagePlus size={22} />
              </span>
              Upload category image
              <span className="text-xs font-medium text-gray-400">Shown on storefront category cards</span>
            </span>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1" style={{ borderColor: 'var(--border-color)' }}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button type="submit" disabled={submitting} className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md disabled:cursor-not-allowed disabled:opacity-60" style={{ background: 'var(--primary)' }}>
          {submitting ? 'Saving...' : initialData ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </form>
  )
}
