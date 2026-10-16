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
    <div className="flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-slate-200 bg-white px-2 md:overflow-visible">
      <ToolButton icon={Bold} label="Bold" tooltip="Bold (Ctrl+B)" alignTooltip="left" pressed={props.bold} onClick={props.onToggleBold} />
      <Divider />
      <ToolButton icon={Sigma} label="SUM" tooltip="Insert SUM" onClick={() => props.onInsertFunction('SUM')} />
      <ToolButton text="AVG" label="AVERAGE" tooltip="Insert AVERAGE" onClick={() => props.onInsertFunction('AVERAGE')} />
      <Divider />
      <ToolButton
        icon={Waypoints}
        text="Trace"
        label="Trace"
        tooltip="Show cells a formula reads and affects"
        pressed={props.trace}
        onClick={props.onToggleTrace}
      />
      <ToolButton icon={Eraser} label="Clear" tooltip="Clear cell (Delete)" onClick={props.onClear} />
      <Divider />
      <ToolButton icon={Upload} label="Import CSV" tooltip="Import CSV" onClick={props.onImport} />
      <ToolButton icon={Download} label="Export CSV" tooltip="Export CSV" onClick={props.onExport} />

      <div className="ml-auto flex items-center pl-2">
        <ToolButton
          icon={RotateCcw}
          text="Reset sample"
          label="Reset sample"
          tooltip="Restore the sample marks sheet"
          alignTooltip="right"
          onClick={props.onReset}
        />
      </div>
    </div>
  )
}

interface ToolButtonProps {
  icon?: LucideIcon
  text?: string
  label: string
  tooltip: string
  pressed?: boolean
  alignTooltip?: 'left' | 'center' | 'right'
  onClick: () => void
}

function ToolButton({ icon: Icon, text, label, tooltip, pressed, alignTooltip = 'center', onClick }: ToolButtonProps) {
  return (
    <span className="group relative shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={pressed}
        className={`flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 ${
          pressed ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {Icon && <Icon size={16} strokeWidth={label === 'Bold' ? 2.75 : 2} />}
        {text && <span className={Icon ? 'hidden lg:inline' : ''}>{text}</span>}
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-40 mt-1.5 hidden rounded-md bg-slate-900 px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 md:block ${
          alignTooltip === 'left' ? 'left-0' : alignTooltip === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        {tooltip}
      </span>
    </span>
  )
}

function Divider() {
  return <span className="mx-1.5 h-5 w-px shrink-0 bg-slate-200" aria-hidden="true" />
}
