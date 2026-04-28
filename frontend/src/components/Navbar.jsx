import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, FileText, User, LogOut, Zap, BookOpen, Briefcase, Flag } from 'lucide-react'

const ADMIN_EMAILS = ['malhotra.r@ufl.edu']
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-amber-500 text-xl">✦</span>
            <span className="font-black text-slate-900 text-lg tracking-tight">CLEAROFFER</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
            <NavLink to="/search" active={isActive('/search')}>
              <Search size={14} className="inline mr-1" />Search
            </NavLink>
            <NavLink to="/submit-review" active={isActive('/submit-review')}>
              <FileText size={14} className="inline mr-1" />Write a Review
            </NavLink>
            <NavLink to="/resume-fit" active={isActive('/resume-fit')}>
              <Zap size={14} className="inline mr-1" />Resume Fit
            </NavLink>
            <NavLink to="/opportunities" active={isActive('/opportunities')}>
              <Briefcase size={14} className="inline mr-1" />Opportunities
            </NavLink>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name?.split(' ')[0]}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User size={15} />Profile & Settings
                  </Link>
                  {ADMIN_EMAILS.includes(user?.email) && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Flag size={15} />Moderation
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-amber-50 text-amber-700'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  )
}
