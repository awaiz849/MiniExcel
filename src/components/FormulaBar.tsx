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
    <div className="flex h-10 shrink-0 items-center border-b border-slate-200 bg-white">
      <div className="flex h-full w-16 shrink-0 items-center justify-center border-r border-slate-200 text-sm font-semibold text-slate-700 sm:w-20">
        {address}
      </div>
      <span className="px-3 font-serif text-sm italic text-slate-400" aria-hidden="true">
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
        className="h-full min-w-0 flex-1 pr-3 font-mono text-[13px] text-slate-800 outline-none placeholder:font-sans placeholder:text-slate-400"
      />
    </div>
  )
}
