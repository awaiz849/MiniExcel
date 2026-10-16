import type { ErrorCode, Token } from '../types.ts'

// Thrown anywhere in the engine; the sheet turns it into the cell's error value.
export class FormulaError extends Error {
  code: ErrorCode

  constructor(code: ErrorCode) {
    super(code)
    this.code = code
  }
}

const NUMBER = /^(\d+\.?\d*|\.\d+)/
const WORD = /^[A-Za-z]+\d*/
const SINGLE: Record<string, Token['kind']> = {
  '+': 'op',
  '-': 'op',
  '*': 'op',
  '/': 'op',
  '(': '(',
  ')': ')',
  ',': ',',
  ':': ':',
}

// "SUM(A1:A3)*2" -> name SUM, (, ref A1, :, ref A3, ), op *, number 2
export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < source.length) {
    const rest = source.slice(i)

    if (/^\s/.test(rest)) {
      i++
      continue
    }

    const number = NUMBER.exec(rest)
    if (number) {
      tokens.push({ kind: 'number', text: number[0] })
      i += number[0].length
      continue
    }

    const word = WORD.exec(rest)
    if (word) {
      const text = word[0].toUpperCase()
      tokens.push({ kind: /\d/.test(text) ? 'ref' : 'name', text })
      i += text.length
      continue
    }

    const kind = SINGLE[rest[0]]
    if (!kind) throw new FormulaError('#ERR')
    tokens.push({ kind, text: rest[0] })
    i++
  }

  return tokens
}
