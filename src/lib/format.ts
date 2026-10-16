import { isError } from '../engine/evaluate.ts'
import type { CellValue, ErrorCode } from '../types.ts'

const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export function displayValue(value: CellValue): string {
  if (value === null) return ''
  if (typeof value === 'number') return numberFormat.format(value)
  if (isError(value)) return value.error
  return value
}

export const ERROR_HELP: Record<ErrorCode, string> = {
  '#CIRC': 'Circular reference: this formula ends up depending on itself.',
  '#ERR': 'Invalid formula: check the syntax, function name, or text used in maths.',
  '#DIV/0!': 'Division by zero, or AVERAGE of a range with no numbers.',
  '#REF': 'Invalid reference: only cells A1 to J20 exist.',
}
