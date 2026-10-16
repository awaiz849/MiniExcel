import { COLS, ROWS, parseAddress, toAddress } from '../engine/refs.ts'

// Exports raw input, so formulas survive a round trip (and Excel/Sheets understand them too).
export function toCsv(cells: Record<string, string>): string {
  let lastRow = -1
  let lastCol = -1
  for (const address of Object.keys(cells)) {
    const pos = parseAddress(address)
    if (!pos) continue
    lastRow = Math.max(lastRow, pos.row)
    lastCol = Math.max(lastCol, pos.col)
  }

  const lines: string[] = []
  for (let row = 0; row <= lastRow; row++) {
    const fields: string[] = []
    for (let col = 0; col <= lastCol; col++) fields.push(quote(cells[toAddress(col, row)] ?? ''))
    lines.push(fields.join(','))
  }
  return lines.join('\r\n')
}

function quote(field: string): string {
  return /[",\r\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field
}

// RFC 4180 style: quoted fields may contain commas, newlines and "" for a quote.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const source = text.replace(/^﻿/, '')

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    if (inQuotes) {
      if (ch === '"' && source[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// Rows/columns beyond J20 are dropped; `truncated` tells the UI to mention it.
export function cellsFromCsv(text: string): { cells: Record<string, string>; truncated: boolean } {
  const rows = parseCsv(text)
  const cells: Record<string, string> = {}
  let truncated = rows.length > ROWS
  rows.slice(0, ROWS).forEach((fields, row) => {
    if (fields.length > COLS) truncated = true
    fields.slice(0, COLS).forEach((value, col) => {
      if (value.trim() !== '') cells[toAddress(col, row)] = value
    })
  })
  return { cells, truncated }
}
