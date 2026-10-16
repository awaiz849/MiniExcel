import { Lock } from 'lucide-react'
import { isError } from '../engine/evaluate.ts'
import { ERROR_HELP } from '../lib/format.ts'
import type { CellValue } from '../types.ts'

interface StatusBarProps {
  selected: string
  value: CellValue
  recalcOrder: string[]
}

export function StatusBar({ selected, value, recalcOrder }: StatusBarProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 text-xs text-slate-600">
      <span className="shrink-0 font-semibold text-slate-800">{selected}</span>

      <span className="min-w-0 flex-1 truncate">
        {isError(value) ? (
          <span className="text-red-600">{ERROR_HELP[value.error]}</span>
        ) : recalcOrder.length > 0 ? (
          <>
            <span className="text-slate-500">Recalculated {recalcOrder.length}: </span>
            <span className="font-mono text-slate-700">{recalcOrder.join(' → ')}</span>
          </>
        ) : null}
      </span>

      <span className="flex shrink-0 items-center gap-1.5 text-slate-500">
        <Lock size={12} />
        <span className="hidden sm:inline">All data stays in your browser</span>
        <span className="sm:hidden">Stays in browser</span>
      </span>
    </footer>
  )
}
