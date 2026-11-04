import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onNavigate: () => void
}

function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  return (
    <aside
      id="main-sidebar"
      data-open={isOpen}
      className="sidebar-panel fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4 transition-transform duration-200 motion-reduce:transition-none md:z-20"
    >
      <div className="px-3 pb-7 pt-2 text-lg font-bold tracking-tight text-slate-900">
        Workspace
      </div>
      <nav className="grid gap-1.5" aria-label="Main navigation">
        {/* <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex min-h-[42px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
          onClick={onNavigate}
        >
          <svg className="size-5 fill-none stroke-current stroke-[1.7]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
          </svg>
          <span>Home</span>
        </NavLink> */}
        <NavLink
          to="/customers"
          end
          className={({ isActive }) =>
            `flex min-h-[42px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
          onClick={onNavigate}
        >
          <svg
            className="size-5 fill-none stroke-current stroke-[1.7]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a6 6 0 0 1 12 0v2H3Zm14-11h5m-2.5-2.5v5" />
          </svg>
          <span>Customers</span>
        </NavLink>
        {/* <NavLink
          to="/customers/new"
          className={({ isActive }) =>
            `flex min-h-[42px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
          onClick={onNavigate}
        >
          <svg
            className="size-5 fill-none stroke-current stroke-[1.7]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M15 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6m-3-3h6" />
          </svg>
          <span>Create Customer</span>
        </NavLink> */}
        <NavLink
          to="/invoices"
          className={({ isActive }) =>
            `flex min-h-[42px] items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
          onClick={onNavigate}
        >
          <svg
            className="size-5 fill-none stroke-current stroke-[1.7]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M14 3v5h5M9 13h6m-6 4h6" />
          </svg>
          <span>Invoices</span>
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar
