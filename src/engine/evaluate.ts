import type { AstNode, CellError, CellValue, CompareOperator } from '../types.ts'
import { expandRange, parseAddress } from './refs.ts'
import { FormulaError } from './tokenizer.ts'

export interface EvalContext {
  valueOf(address: string): CellValue
}

type Result = number | string | boolean

export function isError(value: CellValue): value is CellError {
  return typeof value === 'object' && value !== null
}

// Walks the tree and returns a number, text or TRUE/FALSE. Any problem throws a FormulaError.
export function evaluate(node: AstNode, ctx: EvalContext): Result {
  switch (node.type) {
    case 'number':
    case 'string':
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

    case 'compare':
      return compare(node.operator, evaluate(node.left, ctx), evaluate(node.right, ctx))

    case 'call': {
      // IF only evaluates the branch it picks, so the other branch may contain an error.
      if (node.name === 'IF') {
        if (node.args.length !== 3) throw new FormulaError('#ERR')
        const [condition, whenTrue, whenFalse] = node.args
        return evaluate(toBoolean(evaluate(condition, ctx)) ? whenTrue : whenFalse, ctx)
      }
      const fn = NUMBER_FUNCTIONS[node.name]
      if (!fn) throw new FormulaError('#ERR')
      return fn(numbersIn(node.args, ctx))
    }
  }
}

const sum = (numbers: number[]) => numbers.reduce((total, n) => total + n, 0)

const NUMBER_FUNCTIONS: Record<string, (numbers: number[]) => number> = {
  SUM: sum,
  AVERAGE: (numbers) => {
    if (numbers.length === 0) throw new FormulaError('#DIV/0!')
    return sum(numbers) / numbers.length
  },
  MIN: (numbers) => (numbers.length === 0 ? 0 : Math.min(...numbers)),
  MAX: (numbers) => (numbers.length === 0 ? 0 : Math.max(...numbers)),
  COUNT: (numbers) => numbers.length,
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

// Numbers compare as numbers, text compares ignoring case. Mixing them is only allowed for = and <>.
function compare(operator: CompareOperator, left: Result, right: Result): boolean {
  if (typeof left !== typeof right) {
    if (operator === '=') return false
    if (operator === '<>') return true
    throw new FormulaError('#ERR')
  }
  const a = typeof left === 'string' ? left.toLowerCase() : left
  const b = typeof right === 'string' ? right.toLowerCase() : right
  switch (operator) {
    case '=':
      return a === b
    case '<>':
      return a !== b
    case '<':
      return a < b
    case '>':
      return a > b
    case '<=':
      return a <= b
    case '>=':
      return a >= b
  }
}

function toNumber(value: Result): number {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value !== 'number') throw new FormulaError('#ERR')
  return value
}

function toBoolean(value: Result): boolean {
  if (typeof value === 'string') throw new FormulaError('#ERR')
  return Boolean(value)
}
