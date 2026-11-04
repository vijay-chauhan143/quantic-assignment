interface HeaderProps {
  isMenuOpen: boolean
  onMenuClick: () => void
}

function Header({ isMenuOpen, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-[68px] items-center gap-3.5 border-b border-slate-200 bg-white px-4 sm:px-8">
      <button
        className="inline-flex size-[38px] cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
        type="button"
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMenuOpen}
        aria-controls="main-sidebar"
        onClick={onMenuClick}
      >
        <svg className="size-5 fill-none stroke-current stroke-[1.7]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="text-[15px] font-semibold text-slate-900">Workspace</span>
    </header>
  )
}

export default Header
