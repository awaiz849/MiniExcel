import type { AstNode, CellError, CellValue } from '../types.ts'
import { expandRange, parseAddress } from './refs.ts'
import { FormulaError } from './tokenizer.ts'

export interface EvalContext {
  valueOf(address: string): CellValue
}

type Result = number | string

export function isError(value: CellValue): value is CellError {
  return typeof value === 'object' && value !== null
}

// Walks the tree and returns a number or text. Any problem throws a FormulaError.
export function evaluate(node: AstNode, ctx: EvalContext): Result {
  switch (node.type) {
    case 'number':
      return node.value

    case 'ref':
      return readCell(node.address, ctx) ?? 0

    case 'range':
      // A range only makes sense inside a function like SUM(A1:A5).
      throw new FormulaError('#ERR')

    case 'unary': {
      const value = toNumber(evaluate(node.operand, ctx))
      return node.operator === '-' ? -value : value
    }

    case 'binary': {
      const left = toNumber(evaluate(node.left, ctx))
      const right = toNumber(evaluate(node.right, ctx))
      switch (node.operator) {
        case '+':
          return left + right
        case '-':
          return left - right
        case '*':
          return left * right
        case '/':
          if (right === 0) throw new FormulaError('#DIV/0!')
          return left / right
      }
    }

    case 'call': {
      const fn = FUNCTIONS[node.name]
      if (!fn) throw new FormulaError('#ERR')
      return fn(numbersIn(node.args, ctx))
    }
  }
}

const FUNCTIONS: Record<string, (numbers: number[]) => number> = {
  SUM: (numbers) => numbers.reduce((total, n) => total + n, 0),
  AVERAGE: (numbers) => {
    if (numbers.length === 0) throw new FormulaError('#DIV/0!')
    return numbers.reduce((total, n) => total + n, 0) / numbers.length
  },
}

// Value of one cell, with errors in that cell passed along. Empty -> null.
function readCell(address: string, ctx: EvalContext): Result | null {
  if (!parseAddress(address)) throw new FormulaError('#REF')
  const value = ctx.valueOf(address)
  if (isError(value)) throw new FormulaError(value.error)
  return value
}

// Function arguments: cells and ranges contribute only their numbers (text and blanks are skipped,
// like Google Sheets); any other expression must evaluate to a number.
function numbersIn(args: AstNode[], ctx: EvalContext): number[] {
  const numbers: number[] = []
  for (const arg of args) {
    if (arg.type === 'range' || arg.type === 'ref') {
      const cells = arg.type === 'range' ? expandRange(arg.from, arg.to) : [arg.address]
      if (!cells) throw new FormulaError('#REF')
      for (const cell of cells) {
        const value = readCell(cell, ctx)
        if (typeof value === 'number') numbers.push(value)
      }
    } else {
      numbers.push(toNumber(evaluate(arg, ctx)))
    }
  }
  return numbers
}

function toNumber(value: Result): number {
  if (typeof value !== 'number') throw new FormulaError('#ERR')
  return value
}
