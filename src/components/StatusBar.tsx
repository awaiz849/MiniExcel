import { Lock } from 'lucide-react'
import { isError } from '../engine/evaluate.ts'
import { ERROR_HELP, displayValue } from '../lib/format.ts'
import type { CellValue } from '../types.ts'

interface StatusBarProps {
  selected: string
  value: CellValue
  trace: { reads: number; affects: number } | null
  recalcOrder: string[]
}

export function StatusBar({ selected, value, trace, recalcOrder }: StatusBarProps) {
  const shown = displayValue(value)

  return (
    <footer className="flex h-8 shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-3 text-xs text-slate-600">
      <span className="flex min-w-0 shrink-0 items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-800 tabular-nums">{selected}</span>
        {isError(value) ? (
          <span className="max-w-48 truncate text-red-600 sm:max-w-none">{ERROR_HELP[value.error]}</span>
        ) : (
          shown && <span className="max-w-28 truncate font-medium text-slate-800 tabular-nums sm:max-w-48">{shown}</span>
        )}
      </span>

      {trace && (
        <span className="hidden shrink-0 items-center gap-3 border-l border-slate-200 pl-3 sm:flex">
          <Legend swatch="border-blue-300 bg-blue-100" label={`Reads ${trace.reads}`} />
          <Legend swatch="border-amber-300 bg-amber-100" label={`Affects ${trace.affects}`} />
        </span>
      )}

      <span className="hidden min-w-0 flex-1 truncate border-l border-slate-200 pl-3 lg:block">
        {recalcOrder.length > 0 && (
          <>
            <span className="text-slate-500">Recalculated {recalcOrder.length}: </span>
            <span className="font-mono text-slate-700">{recalcOrder.join(' → ')}</span>
          </>
        )}
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-slate-500">
        <Lock size={12} />
        <span className="hidden md:inline">All data stays in your browser</span>
        <span className="md:hidden">In your browser</span>
      </span>
    </footer>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm border ${swatch}`} />
      {label}
    </span>
  )
}
