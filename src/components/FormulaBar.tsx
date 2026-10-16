import type { RefObject } from 'react'

interface FormulaBarProps {
  address: string
  value: string
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (draft: string) => void
  onCommit: () => void
  onSubmit: () => void
  onCancel: () => void
}

export function FormulaBar({ address, value, inputRef, onChange, onCommit, onSubmit, onCancel }: FormulaBarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-2">
      <div className="flex h-8 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 tabular-nums sm:w-20">
        {address}
      </div>
      <div className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-slate-200 bg-white transition-shadow duration-150 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20">
        <span
          className="flex h-full items-center border-r border-slate-200 px-2.5 font-serif text-sm font-semibold text-slate-400 italic"
          aria-hidden="true"
        >
          fx
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit()
            } else if (e.key === 'Escape') {
              onCancel()
            }
          }}
          aria-label={`Contents of ${address}`}
          placeholder="Type a value or a formula like =SUM(B2:D2)"
          spellCheck={false}
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-[13px] text-slate-800 outline-none placeholder:font-sans placeholder:text-slate-400"
        />
      </div>
    </div>
  )
}
