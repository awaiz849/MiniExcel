import type { KeyboardEvent, RefObject } from 'react'
import { isError } from '../engine/evaluate.ts'
import { COLS, ROWS, columnLetter, parseAddress, toAddress } from '../engine/refs.ts'
import type { SheetEngine } from '../engine/sheet.ts'
import { ERROR_HELP, displayValue } from '../lib/format.ts'
import type { CellValue, EditState } from '../types.ts'

const ROW_HEADER_WIDTH = 48
const FIRST_COL_WIDTH = 168
const COL_WIDTH = 112

const columns = Array.from({ length: COLS }, (_, i) => i)
const rows = Array.from({ length: ROWS }, (_, i) => i)

interface GridProps {
  engine: SheetEngine
  selected: string
  editing: EditState | null
  bold: Set<string>
  precedents: Set<string>
  dependents: Set<string>
  gridRef: RefObject<HTMLDivElement | null>
  onSelect: (address: string) => void
  onStartEdit: (address: string) => void
  onDraftChange: (draft: string) => void
  onGridKey: (e: KeyboardEvent<HTMLDivElement>) => void
  onEditorKey: (e: KeyboardEvent<HTMLInputElement>) => void
  onCommit: () => void
}

// Numbers right, text left, TRUE/FALSE centred, like Google Sheets.
function alignment(value: CellValue): string {
  if (typeof value === 'number') return 'text-right tabular-nums'
  if (typeof value === 'boolean') return 'text-center'
  return 'text-left'
}

export function Grid(props: GridProps) {
  const { engine, selected, editing, bold, precedents, dependents, gridRef } = props
  const active = parseAddress(selected)
  const tableWidth = ROW_HEADER_WIDTH + FIRST_COL_WIDTH + COL_WIDTH * (COLS - 1)

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      onKeyDown={props.onGridKey}
      aria-label="Spreadsheet grid. Use arrow keys to move, Enter to edit."
      className="min-h-0 flex-1 overflow-auto bg-white outline-none"
    >
      <table className="table-fixed border-separate border-spacing-0 text-sm" style={{ width: tableWidth }}>
        <colgroup>
          <col style={{ width: ROW_HEADER_WIDTH }} />
          {columns.map((col) => (
            <col key={col} style={{ width: col === 0 ? FIRST_COL_WIDTH : COL_WIDTH }} />
          ))}
        </colgroup>

        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 h-7 border-r border-b border-slate-200 bg-slate-50" />
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className={`sticky top-0 z-20 h-7 border-r border-b border-slate-200 text-[11px] font-semibold tracking-wide transition-colors duration-150 ${
                  active?.col === col
                    ? 'bg-emerald-50 text-emerald-700 shadow-[inset_0_-2px_0_var(--color-emerald-600)]'
                    : 'bg-slate-50 text-slate-500'
                }`}
              >
                {columnLetter(col)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row} className="group">
              <th
                scope="row"
                className={`sticky left-0 z-10 h-8 border-r border-b border-slate-200 text-[11px] font-semibold tabular-nums transition-colors duration-150 ${
                  active?.row === row
                    ? 'bg-emerald-50 text-emerald-700 shadow-[inset_-2px_0_0_var(--color-emerald-600)]'
                    : 'bg-slate-50 text-slate-500'
                }`}
              >
                {row + 1}
              </th>
              {columns.map((col) => {
                const address = toAddress(col, row)
                const value = engine.getValue(address)
                const isSelected = address === selected
                const isEditingHere = editing?.address === address
                const error = isError(value) ? value.error : null
                // Errors win over trace tints; plain cells get a subtle row hover.
                const tint = error
                  ? 'bg-red-50'
                  : precedents.has(address)
                    ? 'bg-blue-100/60'
                    : dependents.has(address)
                      ? 'bg-amber-100/60'
                      : 'bg-white group-hover:bg-slate-50'

                return (
                  <td
                    key={col}
                    data-address={address}
                    onClick={() => props.onSelect(address)}
                    onDoubleClick={() => props.onStartEdit(address)}
                    title={error ? ERROR_HELP[error] : undefined}
                    className={`relative h-8 cursor-cell border-r border-b border-slate-200/70 px-2 transition-colors duration-150 touch-manipulation ${tint} ${
                      isSelected ? 'z-[5] ring-2 ring-emerald-600 ring-inset' : ''
                    } ${error ? 'font-medium text-red-600' : 'text-slate-800'} ${bold.has(address) ? 'font-semibold' : ''}`}
                  >
                    {isSelected && !isEditingHere && (
                      <span
                        className="absolute -right-[3px] -bottom-[3px] z-[6] h-[7px] w-[7px] border border-white bg-emerald-600"
                        aria-hidden="true"
                      />
                    )}
                    {isEditingHere && editing.source === 'cell' ? (
                      <input
                        autoFocus
                        value={editing.draft}
                        onChange={(e) => props.onDraftChange(e.target.value)}
                        onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                        onBlur={props.onCommit}
                        onKeyDown={props.onEditorKey}
                        aria-label={`Edit ${address}`}
                        spellCheck={false}
                        className="absolute inset-0 h-full w-full bg-white px-2 font-mono text-[13px] font-normal text-slate-900 shadow-md ring-2 ring-emerald-600 outline-none ring-inset"
                      />
                    ) : (
                      <div className={`truncate ${isEditingHere ? 'text-left' : alignment(value)}`}>
                        {isEditingHere ? editing.draft : displayValue(value)}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
