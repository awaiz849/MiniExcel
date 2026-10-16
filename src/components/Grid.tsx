import { isError } from '../engine/evaluate.ts'
import { COLS, ROWS, columnLetter, parseAddress, toAddress } from '../engine/refs.ts'
import type { SheetEngine } from '../engine/sheet.ts'
import { ERROR_HELP, displayValue } from '../lib/format.ts'
import type { EditState } from '../types.ts'

const ROW_HEADER_WIDTH = 48
const FIRST_COL_WIDTH = 168
const COL_WIDTH = 112

const columns = Array.from({ length: COLS }, (_, i) => i)
const rows = Array.from({ length: ROWS }, (_, i) => i)

interface GridProps {
  engine: SheetEngine
  selected: string
  editing: EditState | null
  onSelect: (address: string) => void
  onStartEdit: (address: string) => void
  onDraftChange: (draft: string) => void
  onCommit: () => void
  onCancel: () => void
}

export function Grid({ engine, selected, editing, onSelect, onStartEdit, onDraftChange, onCommit, onCancel }: GridProps) {
  const active = parseAddress(selected)
  const tableWidth = ROW_HEADER_WIDTH + FIRST_COL_WIDTH + COL_WIDTH * (COLS - 1)

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-white">
      <table className="table-fixed border-separate border-spacing-0 text-sm" style={{ width: tableWidth }}>
        <colgroup>
          <col style={{ width: ROW_HEADER_WIDTH }} />
          {columns.map((col) => (
            <col key={col} style={{ width: col === 0 ? FIRST_COL_WIDTH : COL_WIDTH }} />
          ))}
        </colgroup>

        <thead>
          <tr>
            <th className="sticky top-0 left-0 z-30 h-7 border-r border-b border-slate-200 bg-slate-100" />
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className={`sticky top-0 z-20 h-7 border-r border-b border-slate-200 text-xs font-medium ${
                  active?.col === col ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {columnLetter(col)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th
                scope="row"
                className={`sticky left-0 z-10 h-8 border-r border-b border-slate-200 text-xs font-medium ${
                  active?.row === row ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
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

                return (
                  <td
                    key={col}
                    onClick={() => onSelect(address)}
                    onDoubleClick={() => onStartEdit(address)}
                    title={error ? ERROR_HELP[error] : undefined}
                    className={`relative h-8 cursor-cell border-r border-b border-slate-200 px-2 touch-manipulation ${
                      isSelected ? 'z-[5] ring-2 ring-emerald-600 ring-inset' : ''
                    } ${error ? 'font-medium text-red-600' : 'text-slate-800'}`}
                  >
                    {isEditingHere && editing.source === 'cell' ? (
                      <input
                        autoFocus
                        value={editing.draft}
                        onChange={(e) => onDraftChange(e.target.value)}
                        onBlur={onCommit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            onCommit()
                          } else if (e.key === 'Escape') {
                            onCancel()
                          }
                        }}
                        aria-label={`Edit ${address}`}
                        spellCheck={false}
                        className="absolute inset-0 h-full w-full bg-white px-2 font-mono text-[13px] text-slate-900 shadow-md ring-2 ring-emerald-600 outline-none ring-inset"
                      />
                    ) : (
                      <div className="truncate">{isEditingHere ? editing.draft : displayValue(value)}</div>
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
