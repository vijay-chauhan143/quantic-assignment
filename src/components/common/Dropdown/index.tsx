import { useRef } from 'react'

export interface DropdownItem {
  id: string
  label: string
  onSelect: () => void
  disabled?: boolean
}

export interface DropdownProps {
  label: string
  items: DropdownItem[]
  className?: string
}

function Dropdown({ label, items, className = '' }: DropdownProps) {
  const dropdownRef = useRef<HTMLDetailsElement>(null)

  return (
    <details ref={dropdownRef} className={`relative inline-block ${className}`}>
      <summary className="cursor-pointer list-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 [&::-webkit-details-marker]:hidden">
        {label}
        <span className="ml-2 text-xs text-slate-500" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div
        role="menu"
        aria-label={label}
        className="absolute right-0 z-20 mt-2 min-w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect()
              dropdownRef.current?.removeAttribute('open')
            }}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  )
}

export default Dropdown
