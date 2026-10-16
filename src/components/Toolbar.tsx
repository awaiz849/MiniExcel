import { Eraser, Sigma, type LucideIcon } from 'lucide-react'

interface ToolbarProps {
  onInsertFunction: (name: 'SUM' | 'AVERAGE') => void
  onClear: () => void
}

export function Toolbar({ onInsertFunction, onClear }: ToolbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3">
      <ToolButton icon={Sigma} label="SUM" onClick={() => onInsertFunction('SUM')} />
      <ToolButton label="AVERAGE" onClick={() => onInsertFunction('AVERAGE')} />
      <Divider />
      <ToolButton icon={Eraser} label="Clear cell" onClick={onClear} />
    </div>
  )
}

interface ToolButtonProps {
  icon?: LucideIcon
  label: string
  onClick: () => void
}

function ToolButton({ icon: Icon, label, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-200/70 focus-visible:outline-2 focus-visible:outline-emerald-600"
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-slate-300" />
}
