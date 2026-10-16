// Cosmetic: the app has one sheet, shown as a tab like Google Sheets.
export function SheetTabs() {
  return (
    <div className="flex h-9 shrink-0 items-start border-t border-slate-200 bg-slate-50 px-3">
      <span
        aria-current="page"
        className="-mt-px flex h-8 items-center rounded-b-md border border-t-0 border-slate-200 bg-white px-4 text-[13px] font-semibold text-emerald-700 shadow-[inset_0_2px_0_var(--color-emerald-600)]"
      >
        Sheet1
      </span>
    </div>
  )
}
