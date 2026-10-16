import { Check, Lock, Sheet } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/10">
        <Sheet size={19} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="text-[16px] font-bold tracking-tight text-slate-900">SheetCraft</div>
        <div className="truncate text-xs text-slate-500">Class 10 · Term 1 marks</div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <Check size={14} strokeWidth={2.5} className="text-emerald-600" />
          Saved
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 sm:flex">
          <Lock size={12} strokeWidth={2.25} />
          All data stays in your browser
        </span>
      </div>
    </header>
  )
}
