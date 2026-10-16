import { Lock } from 'lucide-react'
import { isError } from '../engine/evaluate.ts'
import { ERROR_HELP } from '../lib/format.ts'
import type { CellValue } from '../types.ts'

interface StatusBarProps {
  selected: string
  value: CellValue
  trace: { reads: number; affects: number } | null
  recalcOrder: string[]
}

export function StatusBar({ selected, value, trace, recalcOrder }: StatusBarProps) {
  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 text-xs text-slate-600">
      <span className="shrink-0 font-semibold text-slate-800">{selected}</span>

      {trace && (
        <span className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-sky-300 bg-sky-100" />
            Reads {trace.reads}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-amber-300 bg-amber-100" />
            Affects {trace.affects}
          </span>
        </span>
      )}

      <span className="hidden min-w-0 flex-1 truncate md:block">
        {isError(value) ? (
          <span className="text-red-600">{ERROR_HELP[value.error]}</span>
        ) : recalcOrder.length > 0 ? (
          <>
            <span className="text-slate-500">Recalculated {recalcOrder.length}: </span>
            <span className="font-mono text-slate-700">{recalcOrder.join(' → ')}</span>
          </>
        ) : null}
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-slate-500">
        <Lock size={12} />
        <span className="hidden sm:inline">All data stays in your browser</span>
        <span className="sm:hidden">In your browser</span>
      </span>
    </footer>
  )
}
