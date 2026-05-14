import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, FileText, User, LogOut, Briefcase, Flag, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'

const ADMIN_EMAILS = ['malhotra.r@ufl.edu', 'rishab.malhotra7580@gmail.com']

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/submit-review', label: 'Review', icon: FileText },
  { to: '/opportunities', label: 'Jobs', icon: Briefcase },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
    setDrawerOpen(false)
  }

  return (
    <>
      {/* Top navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-amber-500 text-xl">✦</span>
              <span className="font-black text-slate-900 text-lg tracking-tight">CLEAROFFER</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.filter(n => n.to !== '/profile').map(item => (
                <NavLink key={item.to} to={item.to} active={isActive(item.to)}>
                  <item.icon size={14} className="inline mr-1" />{item.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop user menu */}
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user?.name?.split(' ')[0]}</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User size={15} />Profile & Settings
                    </Link>
                    {ADMIN_EMAILS.includes(user?.email) && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <Flag size={15} />Moderation
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={15} />Log out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu size={22} className="text-slate-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-0 flex-1 ${
                  active ? 'text-amber-600' : 'text-slate-400'
                }`}
              >
                <item.icon size={21} className={active ? 'text-amber-500' : ''} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium truncate ${active ? 'text-amber-600' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[160px]">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            {/* Drawer nav */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {NAV_ITEMS.map(item => {
                const active = isActive(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                      active ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </Link>
                )
              })}

              {ADMIN_EMAILS.includes(user?.email) && (
                <Link
                  to="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Flag size={18} />
                  <span className="font-medium text-sm">Moderation</span>
                </Link>
              )}
            </div>

            {/* Drawer footer */}
            <div className="px-3 py-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium text-sm">Log out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom tab bar spacer so content isn't hidden behind it */}
      <div className="md:hidden h-16" />
    </>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  )
}
