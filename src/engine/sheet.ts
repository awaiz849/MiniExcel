import type { AstNode, CellValue } from '../types.ts'
import { evaluate } from './evaluate.ts'
import { parseFormula } from './parser.ts'
import { expandRange, parseAddress } from './refs.ts'
import { FormulaError } from './tokenizer.ts'

const NUMERIC = /^[+-]?(\d+\.?\d*|\.\d+)$/

// The spreadsheet model. Raw input and computed values are stored separately:
//   raw        "=A1*2"   what the user typed
//   values     10        what the cell shows
// and a dependency graph links them:
//   deps       B1 -> {A1}   cells a formula reads
//   dependents A1 -> {B1}   cells that read this one (the reverse edges)
export class SheetEngine {
  private raw = new Map<string, string>()
  private formulas = new Map<string, AstNode | null>() // null = formula that failed to parse
  private values = new Map<string, CellValue>()
  private deps = new Map<string, Set<string>>()
  private dependents = new Map<string, Set<string>>()

  // Cells recomputed by the last change, in the order they were evaluated.
  lastRecalc: string[] = []

  constructor(cells: Record<string, string> = {}) {
    this.load(cells)
  }

  load(cells: Record<string, string>): void {
    this.raw.clear()
    this.formulas.clear()
    this.values.clear()
    this.deps.clear()
    this.dependents.clear()
    for (const [address, input] of Object.entries(cells)) {
      if (parseAddress(address)) this.store(address, input)
    }
    this.recalculate([...this.raw.keys()])
  }

  // Change one cell, then recompute it and everything downstream. Returns the evaluation order.
  setCell(address: string, input: string): string[] {
    this.store(address, input)
    return this.recalculate(this.withDependents(address))
  }

  getRaw(address: string): string {
    return this.raw.get(address) ?? ''
  }

  getValue(address: string): CellValue {
    return this.values.get(address) ?? null
  }

  // Cells this cell's formula reads directly.
  precedentsOf(address: string): string[] {
    return [...(this.deps.get(address) ?? [])]
  }

  // Every cell that would change if this one changed, through any length of chain.
  dependentsOf(address: string): string[] {
    return this.withDependents(address).filter((cell) => cell !== address)
  }

  toJSON(): Record<string, string> {
    return Object.fromEntries(this.raw)
  }

  private store(address: string, input: string): void {
    for (const dep of this.deps.get(address) ?? []) this.dependents.get(dep)?.delete(address)
    this.deps.delete(address)
    this.formulas.delete(address)

    if (input.trim() === '') {
      this.raw.delete(address)
      return
    }
    this.raw.set(address, input)
    if (!input.startsWith('=')) return

    let ast: AstNode | null = null
    try {
      ast = parseFormula(input.slice(1))
    } catch {
      // Stays null: the cell will show #ERR.
    }
    this.formulas.set(address, ast)
    if (!ast) return

    const reads = new Set(referencedCells(ast))
    this.deps.set(address, reads)
    for (const dep of reads) {
      if (!this.dependents.has(dep)) this.dependents.set(dep, new Set())
      this.dependents.get(dep)!.add(address)
    }
  }

  // The changed cell plus every cell that depends on it, directly or through a chain (BFS).
  private withDependents(address: string): string[] {
    const seen = new Set([address])
    const queue = [address]
    while (queue.length > 0) {
      for (const next of this.dependents.get(queue.shift()!) ?? []) {
        if (!seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    return [...seen]
  }

  // Depth-first search over the affected cells. A cell is added to `order` only after all the
  // cells it reads, which gives a topological order. Reaching a cell that is still "visiting"
  // means we walked in a loop: every cell on the stack from there is part of a cycle.
  private recalculate(cells: string[]): string[] {
    const affected = new Set(cells)
    const state = new Map<string, 'visiting' | 'done'>()
    const stack: string[] = []
    const inCycle = new Set<string>()
    const order: string[] = []

    const visit = (cell: string) => {
      if (state.get(cell) === 'done') return
      if (state.get(cell) === 'visiting') {
        for (const member of stack.slice(stack.indexOf(cell))) inCycle.add(member)
        return
      }
      state.set(cell, 'visiting')
      stack.push(cell)
      for (const dep of this.deps.get(cell) ?? []) {
        if (affected.has(dep)) visit(dep)
      }
      stack.pop()
      state.set(cell, 'done')
      order.push(cell)
    }

    for (const cell of affected) visit(cell)

    for (const cell of order) {
      this.values.set(cell, inCycle.has(cell) ? { error: '#CIRC' } : this.compute(cell))
    }
    this.lastRecalc = order
    return order
  }

  private compute(address: string): CellValue {
    const raw = this.raw.get(address)
    if (raw === undefined) return null
    if (!raw.startsWith('=')) return NUMERIC.test(raw.trim()) ? Number(raw) : raw

    const ast = this.formulas.get(address)
    if (!ast) return { error: '#ERR' }
    try {
      return evaluate(ast, { valueOf: (cell) => this.getValue(cell) })
    } catch (error) {
      if (error instanceof FormulaError) return { error: error.code }
      throw error
    }
  }
}

// Every valid cell a formula reads, with ranges expanded. Invalid refs are left out;
// they show #REF when evaluated.
function referencedCells(node: AstNode): string[] {
  switch (node.type) {
    case 'number':
    case 'string':
      return []
    case 'ref':
      return parseAddress(node.address) ? [node.address] : []
    case 'range':
      return expandRange(node.from, node.to) ?? []
    case 'unary':
      return referencedCells(node.operand)
    case 'binary':
    case 'compare':
      return [...referencedCells(node.left), ...referencedCells(node.right)]
    case 'call':
      return node.args.flatMap(referencedCells)
  }
}
