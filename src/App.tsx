import { useCallback, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog.tsx'
import { FormulaBar } from './components/FormulaBar.tsx'
import { Grid } from './components/Grid.tsx'
import { SheetTabs } from './components/SheetTabs.tsx'
import { StatusBar } from './components/StatusBar.tsx'
import { Toasts } from './components/Toasts.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { TopBar } from './components/TopBar.tsx'
import { SEED } from './data/seed.ts'
import { COLS, ROWS, parseAddress, toAddress } from './engine/refs.ts'
import { SheetEngine } from './engine/sheet.ts'
import { cellsFromCsv, toCsv } from './lib/csv.ts'
import { useLocalStorage } from './lib/useLocalStorage.ts'
import { useToasts } from './lib/useToasts.ts'
import type { EditState, SavedSheet } from './types.ts'

const STORAGE_KEY = 'sheetcraft:v1'
const MAX_IMPORT_BYTES = 1_000_000

type PendingConfirm =
  | { kind: 'reset' }
  | { kind: 'import'; fileName: string; cells: Record<string, string>; truncated: boolean }

function isSavedSheet(value: unknown): value is SavedSheet {
  const sheet = value as SavedSheet
  return typeof sheet === 'object' && sheet !== null && typeof sheet.cells === 'object' && Array.isArray(sheet.bold)
}

const clamp = (n: number, max: number) => Math.min(Math.max(n, 0), max)

export default function App() {
  const [saved, setSaved] = useLocalStorage(STORAGE_KEY, () => SEED, isSavedSheet)
  const [engine] = useState(() => new SheetEngine(saved.cells))
  const [selected, setSelected] = useState('A1')
  const [editing, setEditing] = useState<EditState | null>(null)
  const [recalcOrder, setRecalcOrder] = useState<string[]>([])
  const [trace, setTrace] = useState(true)
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null)
  const { toasts, showToast } = useToasts()

  const gridRef = useRef<HTMLDivElement>(null)
  const formulaInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bold = useMemo(() => new Set(saved.bold), [saved.bold])

  // Mirror of `editing` that updates synchronously, so a blur that fires right after
  // Escape cannot commit the edit we just cancelled.
  const editRef = useRef<EditState | null>(null)
  const updateEdit = (next: EditState | null) => {
    editRef.current = next
    setEditing(next)
  }

  function applyChange(address: string, input: string) {
    setRecalcOrder(engine.setCell(address, input))
    setSaved((sheet) => ({ ...sheet, cells: engine.toJSON() }))
  }

  function loadSheet(sheet: SavedSheet) {
    updateEdit(null)
    engine.load(sheet.cells)
    setSaved(sheet)
    setSelected('A1')
    setRecalcOrder([])
  }

  function focusGrid() {
    gridRef.current?.focus({ preventScroll: true })
  }

  function select(address: string) {
    setSelected(address)
    requestAnimationFrame(() =>
      gridRef.current?.querySelector(`[data-address="${address}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }),
    )
  }

  function move(dCol: number, dRow: number) {
    const pos = parseAddress(selected)
    if (pos) select(toAddress(clamp(pos.col + dCol, COLS - 1), clamp(pos.row + dRow, ROWS - 1)))
  }

  // --- editing -------------------------------------------------------------

  function commit() {
    const edit = editRef.current
    if (!edit) return
    updateEdit(null)
    if (edit.draft !== engine.getRaw(edit.address)) applyChange(edit.address, edit.draft)
  }

  function commitAndMove(dCol: number, dRow: number) {
    commit()
    move(dCol, dRow)
    focusGrid()
  }

  function cancelEdit() {
    updateEdit(null)
    focusGrid()
  }

  function startCellEdit(address: string, draft = engine.getRaw(address)) {
    setSelected(address)
    updateEdit({ address, draft, source: 'cell' })
  }

  function changeDraft(draft: string, source: EditState['source']) {
    updateEdit({ address: editRef.current?.address ?? selected, draft, source })
  }

  function insertFunction(name: 'SUM' | 'AVERAGE') {
    const draft = `=${name}()`
    updateEdit({ address: selected, draft, source: 'bar' })
    requestAnimationFrame(() => {
      formulaInputRef.current?.focus()
      formulaInputRef.current?.setSelectionRange(draft.length - 1, draft.length - 1)
    })
  }

  function handleGridKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return // keys typed inside the cell editor
    const withModifier = e.ctrlKey || e.metaKey
    if (withModifier && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      toggleBold()
      return
    }
    if (withModifier || e.altKey) return

    switch (e.key) {
      case 'ArrowUp':
        move(0, -1)
        break
      case 'ArrowDown':
        move(0, 1)
        break
      case 'ArrowLeft':
        move(-1, 0)
        break
      case 'ArrowRight':
        move(1, 0)
        break
      case 'Tab':
        move(e.shiftKey ? -1 : 1, 0)
        break
      case 'Enter':
      case 'F2':
        startCellEdit(selected)
        break
      case 'Delete':
      case 'Backspace':
        clearSelected()
        break
      default:
        if (e.key.length !== 1) return
        startCellEdit(selected, e.key) // typing replaces the cell, like Sheets
    }
    e.preventDefault()
  }

  function handleEditorKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitAndMove(0, e.shiftKey ? -1 : 1)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      commitAndMove(e.shiftKey ? -1 : 1, 0)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  // --- toolbar actions -----------------------------------------------------

  function toggleBold() {
    setSaved((sheet) => ({
      ...sheet,
      bold: sheet.bold.includes(selected) ? sheet.bold.filter((a) => a !== selected) : [...sheet.bold, selected],
    }))
  }

  function clearSelected() {
    updateEdit(null)
    if (engine.getRaw(selected) === '') return
    applyChange(selected, '')
    showToast(`Cleared ${selected}`)
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be picked again
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      showToast('That file is too large (max 1 MB)', 'error')
      return
    }
    const { cells, truncated } = cellsFromCsv(await file.text())
    if (Object.keys(cells).length === 0) {
      showToast('No data found in that file', 'error')
      return
    }
    setConfirm({ kind: 'import', fileName: file.name, cells, truncated })
  }

  function exportCsv() {
    const cells = engine.toJSON()
    if (Object.keys(cells).length === 0) {
      showToast('The sheet is empty, nothing to export', 'error')
      return
    }
    const url = URL.createObjectURL(new Blob([toCsv(cells)], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'sheetcraft.csv'
    link.click()
    URL.revokeObjectURL(url)
    showToast('Exported sheetcraft.csv')
  }

  const closeConfirm = useCallback(() => {
    setConfirm(null)
    gridRef.current?.focus({ preventScroll: true })
  }, [])

  function confirmAction() {
    if (!confirm) return
    if (confirm.kind === 'reset') {
      loadSheet(SEED)
      showToast('Sample data restored')
    } else {
      loadSheet({ cells: confirm.cells, bold: [] })
      showToast(`Imported ${confirm.fileName}${confirm.truncated ? ' (trimmed to A1:J20)' : ''}`)
    }
    closeConfirm()
  }

  // --- render --------------------------------------------------------------

  const precedents = new Set(trace ? engine.precedentsOf(selected) : [])
  const dependents = new Set(trace ? engine.dependentsOf(selected) : [])
  const barValue = editing?.address === selected ? editing.draft : engine.getRaw(selected)

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <Toolbar
        bold={bold.has(selected)}
        trace={trace}
        onToggleBold={toggleBold}
        onToggleTrace={() => setTrace((on) => !on)}
        onInsertFunction={insertFunction}
        onClear={clearSelected}
        onImport={() => fileInputRef.current?.click()}
        onExport={exportCsv}
        onReset={() => setConfirm({ kind: 'reset' })}
      />
      <FormulaBar
        address={selected}
        value={barValue}
        inputRef={formulaInputRef}
        onChange={(draft) => changeDraft(draft, 'bar')}
        onCommit={commit}
        onSubmit={() => commitAndMove(0, 1)}
        onCancel={cancelEdit}
      />
      <Grid
        engine={engine}
        selected={selected}
        editing={editing}
        bold={bold}
        precedents={precedents}
        dependents={dependents}
        gridRef={gridRef}
        onSelect={select}
        onStartEdit={(address) => startCellEdit(address)}
        onDraftChange={(draft) => changeDraft(draft, 'cell')}
        onGridKey={handleGridKey}
        onEditorKey={handleEditorKey}
        onCommit={commit}
      />
      <SheetTabs />
      <StatusBar
        selected={selected}
        value={engine.getValue(selected)}
        trace={trace ? { reads: precedents.size, affects: dependents.size } : null}
        recalcOrder={recalcOrder}
      />

      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      <Toasts toasts={toasts} />

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'reset' ? 'Reset to sample data?' : `Import ${confirm.fileName}?`}
          message={
            confirm.kind === 'reset'
              ? 'This replaces everything in the sheet with the original marks sheet. Your changes will be lost.'
              : 'This replaces everything in the current sheet with the file contents.'
          }
          confirmLabel={confirm.kind === 'reset' ? 'Reset sheet' : 'Import'}
          onConfirm={confirmAction}
          onCancel={closeConfirm}
        />
      )}
    </div>
  )
}
