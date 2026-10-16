export const COLS = 10 // A–J
export const ROWS = 20

export function columnLetter(index: number): string {
  let letters = ''
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    letters = String.fromCharCode(65 + rem) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}

export function columnIndex(letters: string): number {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

// col and row are 0-based: toAddress(0, 0) === 'A1'
export function toAddress(col: number, row: number): string {
  return `${columnLetter(col)}${row + 1}`
}

// Returns null for anything that is not a cell inside the A1:J20 grid.
export function parseAddress(address: string): { col: number; row: number } | null {
  const match = /^([A-Z]+)(\d+)$/.exec(address)
  if (!match) return null
  const col = columnIndex(match[1])
  const row = Number(match[2]) - 1
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null
  return { col, row }
}

// A1:B3 -> [A1, B1, A2, B2, A3, B3]. Works in either corner order. null if a corner is invalid.
export function expandRange(from: string, to: string): string[] | null {
  const a = parseAddress(from)
  const b = parseAddress(to)
  if (!a || !b) return null
  const cells: string[] = []
  for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
    for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) {
      cells.push(toAddress(col, row))
    }
  }
  return cells
}
