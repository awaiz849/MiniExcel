import { CheckCircle2 } from 'lucide-react'
import type { Toast } from '../types.ts'

export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-12 z-50 flex flex-col items-end gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-lg"
        >
          <CheckCircle2 size={16} className="text-emerald-600" />
          {toast.message}
        </div>
      ))}
    </div>
  )
}
