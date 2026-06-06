import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/deals', label: 'Deal Pipeline', icon: '📋' },
  { to: '/contacts', label: 'Contacts', icon: '👥' },
  { to: '/properties', label: 'Properties', icon: '🏠' },
  { to: '/tasks', label: 'Tasks', icon: '✅' },
  { to: '/portfolios', label: 'Portfolios', icon: '💼' },
  { to: '/nurture', label: 'Auto-Nurture', icon: '🤖' },
]

export default function DashboardLayout() {
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-xl font-bold">Douglas RE</h1>
          <p className="text-sm text-slate-400 mt-1">Real Estate Systems</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white w-full rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
