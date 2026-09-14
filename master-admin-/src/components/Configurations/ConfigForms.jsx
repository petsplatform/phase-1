import { useState, useRef, useEffect } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { uploadApi } from '../../api/uploadApi'
import { showValidationError, validatePositiveNumber, validateRequiredFields } from '../../utils/formValidation'

async function uploadImageIfNeeded(image, imageFile, fallbackName) {
  if (imageFile) {
    const uploaded = await uploadApi.uploadImage(imageFile)
    return uploaded.data.url
  }

  if (typeof image === 'string' && image.startsWith('data:')) {
    const response = await fetch(image)
    const blob = await response.blob()
    const file = new File([blob], fallbackName, { type: blob.type || 'image/png' })
    const uploaded = await uploadApi.uploadImage(file)
    return uploaded.data.url
  }

  return image
}

function toDateInput(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayDateInput() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toRecordStatus(value) {
  return String(value || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
}

function getCouponFormData(initialData) {
  return initialData ? {
    ...initialData,
    expiry: toDateInput(initialData.expiry),
    status: toRecordStatus(initialData.status),
  } : {
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxUses: '',
    expiry: '',
    status: 'Active'
  }
}

export function CouponForm({ onSubmit, initialData = null }) {
  const todayDate = getTodayDateInput()
  const submittingRef = useRef(false)
  const [formData, setFormData] = useState(() => getCouponFormData(initialData))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormData(getCouponFormData(initialData))
  }, [initialData?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving || submittingRef.current) return

    if (!validateRequiredFields([
      { label: 'Coupon code', value: formData.code },
      { label: 'Coupon type', value: formData.type },
      { label: formData.type === 'percentage' ? 'Percentage' : 'Amount', value: formData.value },
      { label: 'Minimum order', value: formData.minOrder },
      { label: 'Max uses', value: formData.maxUses },
      { label: 'Status', value: formData.status },
    ])) return

    if (
      !validatePositiveNumber(formData.value, formData.type === 'percentage' ? 'Percentage' : 'Amount') ||
      !validatePositiveNumber(formData.minOrder, 'Minimum order', { allowZero: true }) ||
      !validatePositiveNumber(formData.maxUses, 'Max uses')
    ) {
      return
    }

    const expiryDate = formData.expiry ? formData.expiry.split('T')[0] : ''
    if (expiryDate && expiryDate < todayDate) {
      showValidationError('Expiry date must be today or a future date.')
      return
    }

    submittingRef.current = true
    setSaving(true)
    try {
      await onSubmit({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        value: Number(formData.value),
        minOrder: Number(formData.minOrder),
        maxUses: Number(formData.maxUses),
        expiry: expiryDate || null,
      })
    } catch (error) {
      showValidationError(error.message || 'Unable to save coupon.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Coupon Code</label>
        <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg uppercase" placeholder="SAVE50" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Type</label>
        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg">
          <option value="percentage">Percentage</option>
          <option value="flat">Flat Amount</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">{formData.type === 'percentage' ? 'Percentage (%)' : 'Amount (USD)'}</label>
        <input required type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="0" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Min Order (USD)</label>
        <input required type="number" value={formData.minOrder} onChange={e => setFormData({...formData, minOrder: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="0" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Max Uses</label>
        <input required type="number" value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="100" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Expiry Date</label>
        <input type="date" value={toDateInput(formData.expiry)} min={todayDate} onChange={e => setFormData({...formData, expiry: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div className="md:col-span-2 pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md disabled:cursor-not-allowed disabled:opacity-70"
          style={{ background: 'var(--primary)' }}
        >
          {saving ? 'Saving...' : initialData ? 'Update Coupon' : 'Create Coupon'}
        </button>
      </div>
    </form>
  )
}

export function TaxForm({ onSubmit, initialData = null }) {
  const submittingRef = useRef(false)
  const [formData, setFormData] = useState(initialData || {
    name: '',
    rate: '',
    description: '',
    status: 'Active'
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving || submittingRef.current) return

    if (!validateRequiredFields([
      { label: 'Tax name', value: formData.name },
      { label: 'Tax rate', value: formData.rate },
      { label: 'Status', value: formData.status },
    ])) return

    if (!validatePositiveNumber(formData.rate, 'Tax rate', { allowZero: true })) return

    const rate = Number(formData.rate)
    if (rate > 100) {
      showValidationError('Tax rate cannot be greater than 100%.')
      return
    }

    submittingRef.current = true
    setSaving(true)
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        rate,
        description: formData.description?.trim() || null,
      })
    } catch (error) {
      showValidationError(error.message || 'Unable to save tax rate.')
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Tax Name</label>
        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Sales Tax" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Rate (%)</label>
        <input required type="number" min="0" max="100" step="0.01" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="5" />
      </div>
      <div className="space-y-1 md:col-span-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Description</label>
        <textarea rows={3} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Applied during checkout" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div className="md:col-span-2 pt-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md disabled:cursor-not-allowed disabled:opacity-70"
          style={{ background: 'var(--primary)' }}
        >
          {saving ? 'Saving...' : initialData ? 'Update Tax' : 'Create Tax'}
        </button>
      </div>
    </form>
  )
}

export function BannerForm({ onSubmit, initialData = null }) {
  const todayDate = getTodayDateInput()
  const defaultPosition = 'Home Top'
  const [formData, setFormData] = useState(() => initialData
    ? {
        ...initialData,
        position: defaultPosition,
        startDate: toDateInput(initialData.startDate),
        endDate: toDateInput(initialData.endDate),
        status: toRecordStatus(initialData.status),
        image: initialData.image || '',
      }
    : { title: '', subtitle: '', buttonText: '', link: '', position: defaultPosition, startDate: '', endDate: '', status: 'Active', image: '' })
  const [preview, setPreview] = useState(initialData?.image || null)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const endDateMin = formData.startDate && formData.startDate > todayDate ? formData.startDate : todayDate

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPreview(ev.target.result)
    }
    reader.readAsDataURL(file)
    setImageFile(file)
  }

  const removeImage = () => {
    setPreview(null)
    setImageFile(null)
    setFormData(f => ({ ...f, image: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateRequiredFields([
      { label: 'Banner image', value: imageFile || formData.image },
      { label: 'Banner title', value: formData.title },
      { label: 'Start date', value: formData.startDate },
      { label: 'End date', value: formData.endDate },
      { label: 'Status', value: formData.status },
    ])) return

    if (formData.startDate < todayDate) {
      showValidationError('Start date must be today or a future date.')
      return
    }

    if (formData.endDate < todayDate) {
      showValidationError('End date must be today or a future date.')
      return
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      showValidationError('End date must be on or after start date.')
      return
    }

    setSaving(true)
    try {
      const image = await uploadImageIfNeeded(formData.image, imageFile, 'banner-image.png')

      await onSubmit({ ...formData, position: defaultPosition, image, status: toRecordStatus(formData.status) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1 md:col-span-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Banner Image</label>

        {preview ? (
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Upload size={20} className="text-gray-300 mb-1" />
            <span className="text-xs text-gray-400">Click to upload banner image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        )}
      </div>
      <div className="space-y-1 md:col-span-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Banner Title</label>
        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Summer Sale" />
      </div>
      <div className="space-y-1 md:col-span-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Subtitle</label>
        <input value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Get first pet-care purchase" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Button Text</label>
        <input value={formData.buttonText || ''} onChange={e => setFormData({...formData, buttonText: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Discover More" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Button Link</label>
        <input value={formData.link || ''} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="/products" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
        <input required type="date" value={formData.startDate} min={todayDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
        <input required type="date" value={formData.endDate} min={endDateMin} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg">
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div className="md:col-span-2 pt-4 flex justify-end">
        <button disabled={saving} type="submit" className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md disabled:cursor-not-allowed disabled:opacity-70" style={{ background: 'var(--primary)' }}>{saving ? 'Saving...' : initialData ? 'Update Banner' : 'Add Banner'}</button>
      </div>
    </form>
  )
}

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [])

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    onChange(editorRef.current?.innerHTML || '')
  }

  const tools = [
    { label: 'Normal', isSelect: true, options: [
      { label: 'Normal', val: 'p' }, { label: 'H1', val: 'h1' },
      { label: 'H2', val: 'h2' }, { label: 'H3', val: 'h3' }
    ]},
    { cmd: 'bold', icon: 'B', style: 'font-bold' },
    { cmd: 'italic', icon: 'I', style: 'italic' },
    { cmd: 'underline', icon: 'U', style: 'underline' },
    { cmd: 'strikeThrough', icon: 'S', style: 'line-through' },
    { cmd: 'insertUnorderedList', icon: '≡', title: 'Bullet List' },
    { cmd: 'insertOrderedList', icon: '≡', title: 'Numbered List', ordered: true },
    { cmd: 'removeFormat', icon: 'Tx', title: 'Clear Format' },
  ]

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50" style={{ borderColor: 'var(--border-color)' }}>
        <select
          className="text-xs border-0 bg-transparent text-gray-600 font-medium cursor-pointer outline-none mr-1 pr-1"
          defaultValue="p"
          onChange={e => exec('formatBlock', e.target.value)}
        >
          <option value="p">Normal</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
        </select>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        {[['bold','B','font-bold'],['italic','I','italic'],['underline','U','underline'],['strikeThrough','S','line-through']].map(([cmd, icon, style]) => (
          <button key={cmd} type="button" onMouseDown={e => { e.preventDefault(); exec(cmd) }}
            className={`w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold ${style}`}>
            {icon}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList') }}
          className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center" title="Bullet list">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
        </button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList') }}
          className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center" title="Numbered list">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">1.</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none">2.</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none">3.</text></svg>
        </button>
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('removeFormat') }}
          className="w-7 h-7 rounded text-xs text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center font-bold" title="Clear format">
          T<sub style={{fontSize:'8px'}}>x</sub>
        </button>
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        className="min-h-[120px] px-3 py-2.5 text-sm text-gray-800 outline-none leading-relaxed"
        style={{ wordBreak: 'break-word' }}
        data-placeholder="Write blog content here..."
      />
      <style>{`.\[contenteditable\]:empty:before,.min-h-\[120px\][contenteditable]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}`}</style>
    </div>
  )
}

export function NotificationForm({ onSubmit }) {
  const [formData, setFormData] = useState({ title: '', target: 'All Users', message: '', status: 'Sent' })
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData) }
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Title</label>
        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Urgent Maintenance Alert" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Target Audience</label>
        <select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg">
          <option>All Users</option>
          <option>VIP Customers</option>
          <option>Staff Only</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase">Message</label>
        <textarea required rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-3 py-2 text-sm border rounded-lg" placeholder="Enter notification message..." />
      </div>
      <div className="flex justify-end pt-4">
        <button type="submit" className="px-6 py-2 text-sm font-semibold text-white rounded-xl shadow-md" style={{ background: 'var(--primary)' }}>Send Notification</button>
      </div>
    </form>
  )
}
