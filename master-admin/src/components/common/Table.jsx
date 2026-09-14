import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Pagination from './Pagination'
import { motion } from "framer-motion";
import { ADMIN_SEARCH_PLACEHOLDER } from '../../constants/search'

export default function Table({
  columns,
  data,
  title,
  actions,
  searchKey,
  searchValue,
  onSearchChange,
  searchPlaceholder = ADMIN_SEARCH_PLACEHOLDER,
  serverSearch = false,
  filterControls,
  emptyMessage = 'No records found',
  onFilteredChange
}) {
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 10
  const activeSearch = searchValue ?? search

  const storeOptions = useMemo(() => {
    const stores = new Map()
    data.forEach(row => {
      const key = row.storeKey || row.storeName
      if (key) stores.set(key, row.storeName || key)
    })
    return [...stores.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [data])

  const filtered = useMemo(() => {
    const query = activeSearch.toLowerCase()
    return data.filter(row => {
      const matchesStore =
        storeFilter === 'All' ||
        row.storeKey === storeFilter ||
        row.storeName === storeFilter
      const matchesSearch =
        serverSearch ||
        !searchKey ||
        String(row[searchKey] || '').toLowerCase().includes(query)
      return matchesStore && matchesSearch
    })
  }, [activeSearch, data, searchKey, serverSearch, storeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  useEffect(() => {
    setPage(current => Math.min(current, totalPages))
  }, [totalPages])

  useEffect(() => {
    if (storeFilter !== 'All' && !storeOptions.some(store => store.value === storeFilter)) {
      setStoreFilter('All')
    }
  }, [storeFilter, storeOptions])

  useEffect(() => {
    setPage(1)
  }, [activeSearch])

  useEffect(() => {
    onFilteredChange?.(filtered)
  }, [filtered, onFilteredChange])

  const handleSearchChange = (value) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setSearch(value)
    }
    setPage(1)
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--admin-shadow)' }}>
      {/* Header */}
      {(title || actions || searchKey) && (
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--border-color)' }}>
          {title && <h3 className="font-display font-semibold text-[var(--text-primary)] text-sm whitespace-nowrap">{title}</h3>}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* {searchKey && (
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={activeSearch}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-soft)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)] w-full sm:w-44"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            )} */}
            {filterControls}
            {storeOptions.length > 1 && (
              <select
                value={storeFilter}
                onChange={event => { setStoreFilter(event.target.value); setPage(1) }}
                className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)] w-full sm:w-40"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <option value="All">All Stores</option>
                {storeOptions.map(store => (
                  <option key={store.value} value={store.value}>{store.label}</option>
                ))}
              </select>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="md:hidden px-5 py-2 text-[10px] font-semibold text-[var(--text-soft)] uppercase tracking-wider bg-[var(--bg-soft)] border-b" style={{ borderColor: 'var(--border-color)' }}>
        <span className="flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          Scroll horizontally to see more columns
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-soft)' }}>
              {columns.map(col => (
                <th key={col.key} className={`text-left px-4 py-3 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-[var(--text-soft)] text-sm">{emptyMessage}</td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <motion.tr
                  key={row.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-t hover:bg-[var(--bg-soft)] transition-colors"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-2.5 whitespace-nowrap text-[var(--text-muted)] ${col.className || ''}`}>
                      {col.render ? (col.render(row[col.key], row) || '—') : (row[col.key] || '—')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filtered.length}
        itemsPerPage={perPage}
      />
    </div>
  )
}
