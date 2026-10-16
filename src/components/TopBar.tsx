import { Sheet } from 'lucide-react'

export function TopBar() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
        <Sheet size={18} strokeWidth={2.25} />
      </div>
      <span className="text-[17px] font-bold tracking-tight text-slate-900">SheetCraft</span>
      <span className="hidden h-5 w-px bg-slate-200 sm:block" />
      <span className="hidden truncate text-sm text-slate-500 sm:block">Class 10 · Term 1 marks</span>
    </header>
  )
}
