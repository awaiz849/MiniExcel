import type { SavedSheet } from '../types.ts'

const STUDENTS: [string, number, number, number][] = [
  ['Aarav Patil', 78, 85, 72],
  ['Priya Deshmukh', 92, 88, 95],
  ['Rohan Kulkarni', 65, 70, 58],
  ['Sneha Jadhav', 88, 79, 84],
  ['Arjun Shinde', 54, 62, 60],
  ['Ananya Joshi', 95, 91, 89],
  ['Kabir Shaikh', 71, 68, 75],
  ['Isha Pawar', 83, 90, 87],
  ['Vedant More', 60, 55, 66],
  ['Fatima Sayyed', 89, 84, 92],
]

// Class 10 marks sheet. Chains to try:
//   B2 -> E2 (Total) -> E13 (class average) -> G2..G11 (vs class average)
//   B2 -> F2 (Average) -> H2 (Result)
//   B19 -> C19 -> D19 -> E19
function buildSeed(): SavedSheet {
  const cells: Record<string, string> = {
    A1: 'Student',
    B1: 'Maths',
    C1: 'Physics',
    D1: 'Chemistry',
    E1: 'Total',
    F1: 'Average',
    G1: 'vs Class Avg',
    H1: 'Result',
  }

  STUDENTS.forEach(([name, maths, physics, chemistry], i) => {
    const row = i + 2
    cells[`A${row}`] = name
    cells[`B${row}`] = String(maths)
    cells[`C${row}`] = String(physics)
    cells[`D${row}`] = String(chemistry)
    cells[`E${row}`] = `=SUM(B${row}:D${row})`
    cells[`F${row}`] = `=AVERAGE(B${row}:D${row})`
    cells[`G${row}`] = `=E${row}-E13`
    cells[`H${row}`] = `=IF(F${row}>=75, "Distinction", "Pass")`
  })

  const summaries: [number, string, string][] = [
    [13, 'Class average', 'AVERAGE'],
    [14, 'Highest', 'MAX'],
    [15, 'Lowest', 'MIN'],
    [16, 'Students', 'COUNT'],
  ]
  for (const [row, label, fn] of summaries) {
    cells[`A${row}`] = label
    for (const col of ['B', 'C', 'D', 'E', 'F']) cells[`${col}${row}`] = `=${fn}(${col}2:${col}11)`
  }
  cells.A17 = 'Class total'
  cells.E17 = '=SUM(E2:E11)'

  cells.A19 = 'Chain: edit B19'
  cells.B19 = '10'
  cells.C19 = '=B19*2'
  cells.D19 = '=C19+5'
  cells.E19 = '=D19/5'

  const bold = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'A13', 'A14', 'A15', 'A16', 'A17', 'A19']
  return { cells, bold }
}

export const SEED: SavedSheet = buildSeed()
