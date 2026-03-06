import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Bell, LogOut, Menu, ChevronRight } from 'lucide-react'
import { useAuth, api } from '../../hooks/useAuth'

function NotificationBell() {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    const fetchCount = () => api.get('/api/notifications/unread-count').then(r => setCount(r.data.count)).catch(() => {})
    fetchCount()
    const interval = setInterval(fetchCount, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifs = async () => {
    if (!open) {
      const res = await api.get('/api/notifications/')
      setNotifs(res.data)
    }
    setOpen(o => !o)
  }

  const markRead = async (id) => {
    await api.put(`/api/notifications/${id}/read`)
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
    setCount(c => Math.max(0, c - 1))
  }

  const typeColors = { alert: '#ef4444', success: '#22c55e', warning: '#f59e0b', info: '#6366f1' }

  return (
    <div className="relative">
      <button onClick={loadNotifs} className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
        <Bell className="w-5 h-5 text-neutral-400" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 glass-strong rounded-2xl overflow-hidden z-50 shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="font-display font-semibold text-sm">Notifications</span>
              <button onClick={() => { api.put('/api/notifications/mark-all-read'); setNotifs(n => n.map(x => ({...x, is_read: true}))); setCount(0) }}
                className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-500">No notifications</div>
              ) : notifs.map(n => (
                <div key={n.id} onClick={() => markRead(n.id)}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${n.is_read ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: typeColors[n.type] || '#6366f1' }} />
                    <div>
                      <div className="text-xs font-semibold mb-0.5">{n.title}</div>
                      <div className="text-xs text-neutral-400 leading-relaxed">{n.message}</div>
                    </div>
                    {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5 ml-auto" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DashboardLayout({ children, navItems }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-[#060614] flex">
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 70 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-shrink-0 glass-strong border-r border-white/5 flex flex-col overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center" style={{boxShadow:'0 0 20px rgba(99,102,241,0.4)'}}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="font-display font-bold text-base whitespace-nowrap">NeuroScan AI</span>}
        </div>

        <div className={`px-4 py-3 border-b border-white/5 ${!sidebarOpen && 'flex justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold">
              {user?.full_name?.[0] || 'U'}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <div className="text-xs font-semibold truncate max-w-[140px]">{user?.full_name}</div>
                <div className="text-[10px] text-neutral-500 capitalize">{user?.role}</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          {navItems.map(item => {
            const active = location.pathname === item.to
            return (
              <Link key={item.to} to={item.to} title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-indigo-500/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-indigo-400' : ''}`} />
                {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                {active && sidebarOpen && <ChevronRight className="w-3 h-3 ml-auto text-indigo-500" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-white/5">
          <button onClick={handleLogout} title={!sidebarOpen ? 'Logout' : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass-strong border-b border-white/5 px-6 py-3.5 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(o => !o)} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <Menu className="w-5 h-5 text-neutral-400" />
          </button>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
