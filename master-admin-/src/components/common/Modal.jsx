import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, width = 'max-w-2xl' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,31,61,0.55)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full ${width} overflow-hidden border`}
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b shadow-[0_2px_8px_-2px_rgba(23,52,95,0.12)] relative z-10 bg-[var(--bg-soft)]" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="font-display font-semibold text-[var(--text-primary)]">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-[var(--accent-gold-soft)] flex items-center justify-center transition-colors text-[var(--text-muted)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
