import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportToCsv, exportToExcel } from '../../utils/exportService'

// Reusable export UI: exports the rows currently passed in (already filtered/searched by the caller).
export default function ExportButtons({ data, columns, filenamePrefix, disabled }) {
  const [exporting, setExporting] = useState(null)

  const isBusy = Boolean(exporting)

  const handleExport = async (format) => {
    if (isBusy || disabled) return
    setExporting(format)
    try {
      if (format === 'csv') {
        exportToCsv(data, columns, filenamePrefix)
      } else {
        await exportToExcel(data, columns, filenamePrefix)
      }
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleExport('csv')}
        disabled={isBusy || disabled}
        className="flex items-center gap-2 border text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {exporting === 'csv' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
      </button>
      <button
        type="button"
        onClick={() => handleExport('excel')}
        disabled={isBusy || disabled}
        className="flex items-center gap-2 border text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {exporting === 'excel' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
      </button>
    </div>
  )
}
