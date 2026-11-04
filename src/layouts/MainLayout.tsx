import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/header/Header'
import Sidebar from '../components/sidebar/Sidebar'

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar isOpen={isSidebarOpen} onNavigate={closeSidebar} />
      {isSidebarOpen && (
        <button
          className="fixed inset-0 z-30 border-0 bg-slate-950/35 md:hidden"
          type="button"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}
      <div className="min-h-screen md:ml-64">
        <Header
          isMenuOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
        />
        <main className="px-5 py-7 sm:px-10 sm:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
