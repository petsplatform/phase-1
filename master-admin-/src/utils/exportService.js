// Reusable export service: turns rows + column definitions into a downloaded CSV or Excel file.
// columns: [{ key, label }] — key supports dot-paths (e.g. "customer.name")

function getValue(row, key) {
  const value = key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), row)
  return value == null ? '' : value
}

function toExportValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function escapeCsvCell(value) {
  const str = String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function buildRows(data, columns) {
  return data.map(row => columns.map(col => toExportValue(
    col.value ? col.value(row) : col.render ? col.render(getValue(row, col.key), row) : getValue(row, col.key),
  )))
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportToCsv(data, columns, filenamePrefix) {
  const header = columns.map(col => escapeCsvCell(col.label)).join(',')
  const rows = buildRows(data, columns).map(row => row.map(escapeCsvCell).join(','))
  const csv = [header, ...rows].join('\r\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${filenamePrefix}-${Date.now()}.csv`)
}

export async function exportToExcel(data, columns, filenamePrefix) {
  const XLSX = await import('xlsx')
  const header = columns.map(col => col.label)
  const rows = buildRows(data, columns)
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')
  XLSX.writeFile(workbook, `${filenamePrefix}-${Date.now()}.xlsx`)
}
