import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import { SheetEngine } from '../src/engine/sheet.ts'
import { cellsFromCsv, toCsv } from '../src/lib/csv.ts'

const err = (code: string) => ({ error: code })

describe('arithmetic', () => {
  test('precedence, parentheses and unary minus', () => {
    const sheet = new SheetEngine({
      A1: '=2+3*4',
      A2: '=(2+3)*4',
      A3: '=-2*-3',
      A4: '=--5',
      A5: '=10/4',
      A6: '=8-2-1',
      A7: '=-(1+2)',
    })
    assert.equal(sheet.getValue('A1'), 14)
    assert.equal(sheet.getValue('A2'), 20)
    assert.equal(sheet.getValue('A3'), 6)
    assert.equal(sheet.getValue('A4'), 5)
    assert.equal(sheet.getValue('A5'), 2.5)
    assert.equal(sheet.getValue('A6'), 5)
    assert.equal(sheet.getValue('A7'), -3)
  })

  test('cell references, lowercase refs and empty cells as 0', () => {
    const sheet = new SheetEngine({ A1: '4', B2: '5', C1: '=A1+B2*3', C2: '=a1+b2', C3: '=D9+1' })
    assert.equal(sheet.getValue('C1'), 19)
    assert.equal(sheet.getValue('C2'), 9)
    assert.equal(sheet.getValue('C3'), 1)
  })

  test('raw input is kept separately from the computed value', () => {
    const sheet = new SheetEngine({ A1: '2', B1: '=A1*10', C1: 'Hello' })
    assert.equal(sheet.getRaw('B1'), '=A1*10')
    assert.equal(sheet.getValue('B1'), 20)
    assert.equal(sheet.getValue('A1'), 2)
    assert.equal(sheet.getValue('C1'), 'Hello')
  })
})

describe('dependency graph', () => {
  test('3-level chain A1 -> B1 -> C1 recomputes in topological order', () => {
    const sheet = new SheetEngine({ A1: '5', B1: '=A1*2', C1: '=B1+1' })
    assert.equal(sheet.getValue('C1'), 11)

    const order = sheet.setCell('A1', '10')
    assert.deepEqual(order, ['A1', 'B1', 'C1'])
    assert.equal(sheet.getValue('B1'), 20)
    assert.equal(sheet.getValue('C1'), 21)
  })

  test('diamond: D1 reads B1 and C1, both read A1; D1 is evaluated last', () => {
    const sheet = new SheetEngine({ A1: '1', B1: '=A1+1', C1: '=A1*10', D1: '=B1+C1' })
    const order = sheet.setCell('A1', '2')
    assert.equal(order[0], 'A1')
    assert.equal(order.at(-1), 'D1')
    assert.equal(sheet.getValue('D1'), 23)
  })

  test('changing a formula rewires its edges', () => {
    const sheet = new SheetEngine({ A1: '1', A2: '100', B1: '=A1' })
    sheet.setCell('B1', '=A2')
    assert.deepEqual(sheet.setCell('A1', '5'), ['A1'])
    assert.equal(sheet.getValue('B1'), 100)
  })

  test('clearing a cell updates the cells that read it', () => {
    const sheet = new SheetEngine({ A1: '7', B1: '=A1+1' })
    sheet.setCell('A1', '')
    assert.equal(sheet.getRaw('A1'), '')
    assert.equal(sheet.getValue('B1'), 1)
  })
})

describe('circular references', () => {
  test('A1 -> B1 -> A1 shows #CIRC and does not hang', () => {
    const sheet = new SheetEngine({ A1: '=B1+1', B1: '=A1+1' })
    assert.deepEqual(sheet.getValue('A1'), err('#CIRC'))
    assert.deepEqual(sheet.getValue('B1'), err('#CIRC'))
  })

  test('self reference and a range that includes itself', () => {
    const sheet = new SheetEngine({ A1: '=A1', A5: '=SUM(A2:A5)' })
    assert.deepEqual(sheet.getValue('A1'), err('#CIRC'))
    assert.deepEqual(sheet.getValue('A5'), err('#CIRC'))
  })

  test('3-cell loop created by an edit, cells downstream show #CIRC, and fixing it recovers', () => {
    const sheet = new SheetEngine({ A1: '1', B1: '=A1', C1: '=B1', D1: '=C1*2' })
    sheet.setCell('A1', '=C1')
    for (const cell of ['A1', 'B1', 'C1', 'D1']) assert.deepEqual(sheet.getValue(cell), err('#CIRC'))

    sheet.setCell('A1', '4')
    assert.equal(sheet.getValue('C1'), 4)
    assert.equal(sheet.getValue('D1'), 8)
  })
})

describe('SUM and AVERAGE', () => {
  test('over ranges, skipping text and blanks', () => {
    const sheet = new SheetEngine({
      A1: '10',
      A2: '20',
      A3: 'n/a',
      A5: '30',
      B1: '=SUM(A1:A5)',
      B2: '=AVERAGE(A1:A5)',
      B3: '=SUM(A1, A2, 5)',
      B4: '=SUM(A1:A2)*2',
      B5: '=AVERAGE(A5:A1)',
    })
    assert.equal(sheet.getValue('B1'), 60)
    assert.equal(sheet.getValue('B2'), 20)
    assert.equal(sheet.getValue('B3'), 35)
    assert.equal(sheet.getValue('B4'), 60)
    assert.equal(sheet.getValue('B5'), 20)
  })

  test('2D range and live update when a cell in the range changes', () => {
    const sheet = new SheetEngine({ A1: '1', B1: '2', A2: '3', B2: '4', C1: '=SUM(A1:B2)' })
    assert.equal(sheet.getValue('C1'), 10)
    sheet.setCell('B2', '40')
    assert.equal(sheet.getValue('C1'), 46)
  })

  test('AVERAGE of an empty range is #DIV/0!', () => {
    const sheet = new SheetEngine({ B1: '=AVERAGE(A1:A3)', B2: '=SUM(A1:A3)' })
    assert.deepEqual(sheet.getValue('B1'), err('#DIV/0!'))
    assert.equal(sheet.getValue('B2'), 0)
  })
})

describe('errors', () => {
  test('division by zero, including by an empty cell', () => {
    const sheet = new SheetEngine({ A1: '=1/0', A2: '5', A3: '=A2/B9', A4: '=A1+1' })
    assert.deepEqual(sheet.getValue('A1'), err('#DIV/0!'))
    assert.deepEqual(sheet.getValue('A3'), err('#DIV/0!'))
    assert.deepEqual(sheet.getValue('A4'), err('#DIV/0!'))
  })

  test('invalid formulas show #ERR', () => {
    const bad = ['=', '=1+', '=(1+2', '=1+2)', '=SUM(', '=FOO(A1)', '=1 2', '=2**3', '=@A1', '=A1:A3', '=SUM']
    for (const formula of bad) {
      const sheet = new SheetEngine({ B1: formula })
      assert.deepEqual(sheet.getValue('B1'), err('#ERR'), formula)
    }
  })

  test('text used in arithmetic is #ERR', () => {
    const sheet = new SheetEngine({ A1: 'Riya', B1: '=A1*2' })
    assert.deepEqual(sheet.getValue('B1'), err('#ERR'))
  })

  test('refs outside A1:J20 show #REF', () => {
    const sheet = new SheetEngine({ A1: '=K1', A2: '=A21+1', A3: '=A0', A4: '=SUM(A1:Z1)', A5: '=AA1' })
    for (const cell of ['A1', 'A2', 'A3', 'A4', 'A5']) assert.deepEqual(sheet.getValue(cell), err('#REF'), cell)
  })
})

describe('MIN, MAX, COUNT and IF', () => {
  test('MIN, MAX and COUNT over a range', () => {
    const sheet = new SheetEngine({
      A1: '40',
      A2: '15',
      A3: 'absent',
      A4: '90',
      B1: '=MIN(A1:A4)',
      B2: '=MAX(A1:A4)',
      B3: '=COUNT(A1:A4)',
      B4: '=MAX(A6:A8)',
    })
    assert.equal(sheet.getValue('B1'), 15)
    assert.equal(sheet.getValue('B2'), 90)
    assert.equal(sheet.getValue('B3'), 3)
    assert.equal(sheet.getValue('B4'), 0)
  })

  test('comparisons return TRUE/FALSE', () => {
    const sheet = new SheetEngine({
      A1: '5',
      B1: '=A1>3',
      B2: '=A1<3',
      B3: '=A1>=5',
      B4: '=A1<=4',
      B5: '=A1=5',
      B6: '=A1<>5',
      B7: '="abc"="ABC"',
      B8: '=A1+1>A1*1',
    })
    assert.deepEqual(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'].map((c) => sheet.getValue(c)),
      [true, false, true, false, true, false, true, true],
    )
  })

  test('IF picks a branch, returns text, and recomputes when its input changes', () => {
    const sheet = new SheetEngine({ A1: '72', B1: '=IF(A1>=75, "Distinction", "Pass")', C1: '=IF(A1>50, A1*2, 0)' })
    assert.equal(sheet.getValue('B1'), 'Pass')
    assert.equal(sheet.getValue('C1'), 144)
    sheet.setCell('A1', '80')
    assert.equal(sheet.getValue('B1'), 'Distinction')
  })

  test('IF only evaluates the chosen branch; wrong arity is #ERR', () => {
    const sheet = new SheetEngine({ A1: '=IF(1>0, 7, 1/0)', A2: '=IF(1>0, 7)', A3: '=IF("x", 1, 2)' })
    assert.equal(sheet.getValue('A1'), 7)
    assert.deepEqual(sheet.getValue('A2'), err('#ERR'))
    assert.deepEqual(sheet.getValue('A3'), err('#ERR'))
  })
})

describe('trace and CSV', () => {
  test('precedentsOf and dependentsOf follow the graph', () => {
    const sheet = new SheetEngine({ A1: '1', B1: '=A1', C1: '=B1+A1', D1: '=SUM(A1:B1)' })
    assert.deepEqual(sheet.precedentsOf('C1').sort(), ['A1', 'B1'])
    assert.deepEqual(sheet.dependentsOf('A1').sort(), ['B1', 'C1', 'D1'])
    assert.deepEqual(sheet.dependentsOf('D1'), [])
  })

  test('CSV round trip keeps formulas, commas and quotes', () => {
    const cells = { A1: 'Name', B1: 'Marks', A2: 'Patil, Aarav', B2: '78', A3: 'Say "hi"', B3: '=SUM(B2:B2)' }
    const csv = toCsv(cells)
    assert.equal(csv.split('\r\n')[1], '"Patil, Aarav",78')
    const { cells: back, truncated } = cellsFromCsv(csv)
    assert.deepEqual(back, cells)
    assert.equal(truncated, false)
    assert.equal(new SheetEngine(back).getValue('B3'), 78)
  })

  test('CSV import drops data outside J20 and reports it', () => {
    const wide = Array.from({ length: 12 }, (_, i) => String(i)).join(',')
    const { cells, truncated } = cellsFromCsv(wide)
    assert.equal(truncated, true)
    assert.equal(cells.J1, '9')
    assert.equal(Object.keys(cells).length, 10)
  })
})

test('engine never uses eval or new Function', () => {
  const dir = new URL('../src/engine/', import.meta.url)
  for (const file of readdirSync(dir)) {
    const source = readFileSync(new URL(file, dir), 'utf-8')
    assert.doesNotMatch(source, /\beval\s*\(|new\s+Function\s*\(/, file)
  }
})
