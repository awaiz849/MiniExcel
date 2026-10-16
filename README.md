# SheetCraft

A mini spreadsheet engine in the browser: formulas, live dependency tracking and circular-reference detection, built without `eval`.

## Features

**Core**
- 10 × 20 grid (A–J, rows 1–20) with sticky column and row headers
- Cells accept numbers, text and formulas such as `=A1+B2*3`; raw input is stored separately from the computed value
- Arithmetic with `+ - * /`, parentheses, unary minus, cell references and ranges (`A1:A5`)
- `SUM(range)` and `AVERAGE(range)`
- Changing a cell recalculates every dependent cell in topological order, including multi-level chains
- Clear error values: `#CIRC` (circular reference), `#ERR` (invalid formula), `#DIV/0!`, `#REF` (reference outside the grid)
- Formula bar shows the raw formula of the selected cell; edit in the cell or the formula bar

**Stretch goals**
- `MIN`, `MAX`, `COUNT` and `IF(condition, a, b)` with `> < >= <= = <>`
- Keyboard navigation: arrow keys, Enter, Tab, Escape, Delete, type-to-edit, Ctrl+B
- CSV import and export (formulas survive a round trip)
- Bold toggle; numbers right-aligned, text left-aligned
- Autosave to `localStorage` and a "Reset sample" button

**Dependency trace**
Select any cell to highlight the cells its formula reads (blue) and every cell that would change if it changed (amber). The status bar shows the exact recalculation order after each edit, for example `B2 → E2 → F2 → E13 → G2 …`.

**Tested**
25 engine tests cover operator precedence, a 3-level chain, diamond dependencies, circular references, SUM/AVERAGE, division by zero, invalid formulas, out-of-grid references, MIN/MAX/COUNT/IF, CSV round trips, and a check that the engine never uses `eval` or `new Function`.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS v4
- lucide-react icons
- Node's built-in test runner (no extra test library)

## How the engine works

All engine code lives in `src/engine/` and has no React dependency.

1. **Tokenizer** (`tokenizer.ts`) turns `=SUM(B2:D2)*2` into tokens: name, `(`, ref, `:`, ref, `)`, operator, number.
2. **Recursive-descent parser** (`parser.ts`) builds an abstract syntax tree. Each precedence level is one function: comparison → `+ -` → `* /` → unary minus → number, text, reference, range, function call or parentheses.
3. **Evaluator** (`evaluate.ts`) walks the tree and returns a number, text or TRUE/FALSE. Errors are thrown as typed `FormulaError`s and become the cell's value.
4. **Dependency graph** (`sheet.ts`) stores, for each cell, which cells it reads and which cells read it (reverse edges).
5. **Topological recalculation**: when a cell changes, a breadth-first search collects it and all its dependents. A depth-first search over those cells adds each one only after the cells it reads, which gives a safe evaluation order.
6. **Cycle detection**: during the same DFS, reaching a cell that is still being visited means a loop. Every cell on that loop is marked `#CIRC`, and cells downstream inherit the error, so the app never freezes.

Formulas are never executed as JavaScript: there is no `eval()` and no `new Function()`.

## Privacy

Everything runs in your browser. Sheet data is saved only to your browser's `localStorage`; nothing is sent to a server, and no account or personal data is needed.

## Run locally

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # run the 25 engine tests
npm run build   # type-check and build for production
```
