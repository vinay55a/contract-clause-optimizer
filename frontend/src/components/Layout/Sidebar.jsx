import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Upload, FileSearch, MessageSquare,
  GitCompare, History, User, LogOut, ChevronLeft,
  ChevronRight, Sparkles, Scale
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Contract' },
  { to: '/history', icon: History, label: 'Contract History' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar({ open, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: open ? 260 : 72 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 h-screen z-40 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(10, 16, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 mb-4" style={{ height: 72, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}>
          <Scale size={20} color="white" />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-white text-sm leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>ClauseAI</p>
              <p className="text-xs" style={{ color: '#475569' }}>Contract Assistant</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle btn */}
      <button
        onClick={onToggle}
        className="absolute top-5 -right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs"
        style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', cursor: 'pointer' }}
      >
        {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {open && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-1 py-2">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
            style={{ background: user?.avatar_color || '#2563EB' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs truncate" style={{ color: '#475569' }}>{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full"
          style={{ color: '#EF4444' }}
        >
          <LogOut size={18} />
          <AnimatePresence>
            {open && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
