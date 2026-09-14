import { useState } from 'react'
import { Star, X } from 'lucide-react'

export default function ReviewModal({
  isOpen,
  onClose,
  productTitle,
  modalRating,
  setModalRating,
  modalTitle,
  setModalTitle,
  modalName,
  setModalName,
  modalComment,
  setModalComment,
  handleReviewSubmit,
}) {
  const [errors, setErrors] = useState({})

  if (!isOpen) return null

  const validate = () => {
    const nextErrors = {}

    const nameVal = String(modalName || '').trim()
    if (!nameVal) {
      nextErrors.name = 'Your name is required.'
    } else if (nameVal.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    } else if (nameVal.length > 50) {
      nextErrors.name = 'Name must not exceed 50 characters.'
    }

    const titleVal = String(modalTitle || '').trim()
    if (titleVal && titleVal.length > 100) {
      nextErrors.title = 'Review title must not exceed 100 characters.'
    }

    const commentVal = String(modalComment || '').trim()
    if (!commentVal) {
      nextErrors.comment = 'Review details are required.'
    } else if (commentVal.length < 10) {
      nextErrors.comment = 'Review details must be at least 10 characters.'
    } else if (commentVal.length > 1000) {
      nextErrors.comment = 'Review details must not exceed 1000 characters.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    handleReviewSubmit(e)
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 text-left"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#e7ddd0] shadow-xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a8f88] hover:text-secondary transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-black text-secondary">Write a Review</h3>
          <p className="text-xs text-[#8a8f88] mt-0.5">Share your feedback for {productTitle}</p>
        </div>

        {/* Review Form */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Star selector */}
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">Rating *</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= modalRating
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setModalRating(star)}
                    className="transition hover:scale-110 cursor-pointer"
                  >
                    <Star
                      size={24}
                      className={isFilled ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-none text-[#d6cec0]'}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="modal-name" className="block text-xs font-bold text-secondary">Your Name *</label>
              <span className="text-[9px] text-[#8a8f88]">Min 2, Max 50 chars</span>
            </div>
            <input
              id="modal-name"
              type="text"
              maxLength={50}
              placeholder="e.g. Sarah Jenkins"
              value={modalName}
              onChange={(e) => {
                setModalName(e.target.value)
                if (errors.name) setErrors((err) => ({ ...err, name: '' }))
              }}
              className={`w-full text-xs bg-[#FAF9F5] border ${
                errors.name ? 'border-rose-400 bg-rose-50' : 'border-[#e7ddd0] focus:border-secondary'
              } rounded-xl px-3 py-2.5 outline-none transition`}
            />
            {errors.name && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.name}</p>}
          </div>

          {/* Title */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="modal-title" className="block text-xs font-bold text-secondary">Review Title</label>
              <span className="text-[9px] text-[#8a8f88]">Max 100 chars</span>
            </div>
            <input
              id="modal-title"
              type="text"
              maxLength={100}
              placeholder="e.g. Excellent purchase, very fast delivery!"
              value={modalTitle}
              onChange={(e) => {
                setModalTitle(e.target.value)
                if (errors.title) setErrors((err) => ({ ...err, title: '' }))
              }}
              className={`w-full text-xs bg-[#FAF9F5] border ${
                errors.title ? 'border-rose-400 bg-rose-50' : 'border-[#e7ddd0] focus:border-secondary'
              } rounded-xl px-3 py-2.5 outline-none transition`}
            />
            {errors.title && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.title}</p>}
          </div>

          {/* Comment */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="modal-comment" className="block text-xs font-bold text-secondary">Review Details *</label>
              <span className="text-[9px] text-[#8a8f88]">Min 10, Max 1000 chars</span>
            </div>
            <textarea
              id="modal-comment"
              rows="3"
              maxLength={1000}
              placeholder="Provide a detailed review of this product..."
              value={modalComment}
              onChange={(e) => {
                setModalComment(e.target.value)
                if (errors.comment) setErrors((err) => ({ ...err, comment: '' }))
              }}
              className={`w-full text-xs bg-[#FAF9F5] border ${
                errors.comment ? 'border-rose-400 bg-rose-50' : 'border-[#e7ddd0] focus:border-secondary'
              } rounded-xl px-3 py-2.5 outline-none transition resize-none`}
            />
            {errors.comment && <p className="mt-1 text-[11px] font-semibold text-rose-600">{errors.comment}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[#e7ddd0] text-secondary hover:bg-neutral-50 py-2.5 text-xs font-extrabold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-full text-white py-2.5 text-xs font-extrabold transition hover:opacity-95 cursor-pointer bg-secondary shadow-md"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
