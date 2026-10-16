import { Bold, Download, Eraser, RotateCcw, Sigma, Upload, Waypoints, type LucideIcon } from 'lucide-react'

interface ToolbarProps {
  bold: boolean
  trace: boolean
  onToggleBold: () => void
  onToggleTrace: () => void
  onInsertFunction: (name: 'SUM' | 'AVERAGE') => void
  onClear: () => void
  onImport: () => void
  onExport: () => void
  onReset: () => void
}

export function Toolbar(props: ToolbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3">
      <ToolButton icon={Bold} label="Bold" title="Bold (Ctrl+B)" iconOnly pressed={props.bold} onClick={props.onToggleBold} />
      <Divider />
      <ToolButton icon={Sigma} label="SUM" onClick={() => props.onInsertFunction('SUM')} />
      <ToolButton label="AVERAGE" onClick={() => props.onInsertFunction('AVERAGE')} />
      <Divider />
      <ToolButton
        icon={Waypoints}
        label="Trace"
        title="Highlight the cells a formula reads and the cells it affects"
        pressed={props.trace}
        onClick={props.onToggleTrace}
      />
      <ToolButton icon={Eraser} label="Clear" title="Clear cell (Delete)" onClick={props.onClear} />

      <div className="ml-auto flex items-center gap-1 pl-2">
        <ToolButton icon={Upload} label="Import CSV" onClick={props.onImport} />
        <ToolButton icon={Download} label="Export CSV" onClick={props.onExport} />
        <Divider />
        <ToolButton icon={RotateCcw} label="Reset sample" onClick={props.onReset} />
      </div>
    </div>
  )
}

interface ToolButtonProps {
  icon?: LucideIcon
  label: string
  title?: string
  iconOnly?: boolean
  pressed?: boolean
  onClick: () => void
}

function ToolButton({ icon: Icon, label, title, iconOnly, pressed, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={label}
      aria-pressed={pressed}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-emerald-600 ${
        pressed ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200/70' : 'text-slate-700 hover:bg-slate-200/70'
      }`}
    >
      {Icon && <Icon size={16} strokeWidth={iconOnly ? 2.5 : 2} />}
      {!iconOnly && <span className={Icon ? 'hidden md:inline' : ''}>{label}</span>}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-slate-300" />
}
