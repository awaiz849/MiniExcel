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
//   B16 -> C16 -> D16 -> E16
function buildSeed(): Record<string, string> {
  const cells: Record<string, string> = {
    A1: 'Student',
    B1: 'Maths',
    C1: 'Physics',
    D1: 'Chemistry',
    E1: 'Total',
    F1: 'Average',
    G1: 'vs Class Avg',
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
  })

  cells.A13 = 'Class average'
  for (const col of ['B', 'C', 'D', 'E', 'F']) cells[`${col}13`] = `=AVERAGE(${col}2:${col}11)`
  cells.A14 = 'Class total'
  cells.E14 = '=SUM(E2:E11)'

  cells.A16 = 'Chain: edit B16'
  cells.B16 = '10'
  cells.C16 = '=B16*2'
  cells.D16 = '=C16+5'
  cells.E16 = '=D16/5'

  return cells
}

export const SEED_CELLS = buildSeed()
