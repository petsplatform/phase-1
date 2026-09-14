import { Trash2, AlertTriangle } from 'lucide-react'
import Modal from './Modal'

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = "",
  confirmLabel = "Yes, Delete",
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="max-w-md">
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 shadow-inner">
          <Trash2 size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Are you sure?</h3>
        <p className="text-sm text-gray-500 px-6">
          {message} {itemName && <span className="font-bold text-gray-700 block mt-2">"{itemName}"</span>}
        </p>
        
        <div className="flex items-center gap-3 w-full mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
