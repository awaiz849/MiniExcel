import { useRef, useState } from 'react'
import { FormulaBar } from './components/FormulaBar.tsx'
import { Grid } from './components/Grid.tsx'
import { StatusBar } from './components/StatusBar.tsx'
import { Toasts } from './components/Toasts.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { TopBar } from './components/TopBar.tsx'
import { SEED_CELLS } from './data/seed.ts'
import { SheetEngine } from './engine/sheet.ts'
import { useToasts } from './lib/useToasts.ts'
import type { EditState } from './types.ts'

export default function App() {
  const [engine] = useState(() => new SheetEngine(SEED_CELLS))
  const [selected, setSelected] = useState('A1')
  const [editing, setEditing] = useState<EditState | null>(null)
  const [recalcOrder, setRecalcOrder] = useState<string[]>([])
  const { toasts, showToast } = useToasts()
  const formulaInputRef = useRef<HTMLInputElement>(null)

  // Mirror of `editing` that updates synchronously, so a blur that fires right after
  // Escape cannot commit the edit we just cancelled.
  const editRef = useRef<EditState | null>(null)
  const updateEdit = (next: EditState | null) => {
    editRef.current = next
    setEditing(next)
  }

  function applyChange(address: string, input: string) {
    setRecalcOrder(engine.setCell(address, input))
  }

  function commit() {
    const edit = editRef.current
    if (!edit) return
    updateEdit(null)
    if (edit.draft !== engine.getRaw(edit.address)) applyChange(edit.address, edit.draft)
  }

  function startCellEdit(address: string) {
    setSelected(address)
    updateEdit({ address, draft: engine.getRaw(address), source: 'cell' })
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

  function clearSelected() {
    updateEdit(null)
    if (engine.getRaw(selected) === '') return
    applyChange(selected, '')
    showToast(`Cleared ${selected}`)
  }

  const barValue = editing?.address === selected ? editing.draft : engine.getRaw(selected)

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <Toolbar onInsertFunction={insertFunction} onClear={clearSelected} />
      <FormulaBar
        address={selected}
        value={barValue}
        inputRef={formulaInputRef}
        onChange={(draft) => changeDraft(draft, 'bar')}
        onCommit={commit}
        onCancel={() => updateEdit(null)}
      />
      <Grid
        engine={engine}
        selected={selected}
        editing={editing}
        onSelect={setSelected}
        onStartEdit={startCellEdit}
        onDraftChange={(draft) => changeDraft(draft, 'cell')}
        onCommit={commit}
        onCancel={() => updateEdit(null)}
      />
      <StatusBar selected={selected} value={engine.getValue(selected)} recalcOrder={recalcOrder} />
      <Toasts toasts={toasts} />
    </div>
  )
}
