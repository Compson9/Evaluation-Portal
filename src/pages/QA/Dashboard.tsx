import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Building2,
  BarChart3,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  type LucideIcon
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import logo from '../../assets/logo.png'

interface MenuItem {
  name: string
  path: string
  icon: LucideIcon
}

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  type: 'info' | 'success' | 'alert';
}

export default function QADashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Realtime subscription simulation
  useEffect(() => {
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/qa/dashboard', icon: LayoutDashboard },
    { name: 'Responses', path: '/qa/responses', icon: MessageSquare },
    { name: 'Forms', path: '/qa/forms', icon: FileText },
    { name: 'Courses', path: '/qa/courses', icon: BookOpen },
    { name: 'Lecturers', path: '/qa/lecturers', icon: Users },
    { name: 'Departments', path: '/qa/departments', icon: Building2 },
    { name: 'Programmes', path: '/qa/programmes', icon: GraduationCap },
    { name: 'Analytics', path: '/qa/analytics', icon: BarChart3 },
  ]

  const handleLogout = () => {
    logout()
    navigate('/qa/login')
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const currentPage = menuItems.find(item => item.path === location.pathname)

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="flex h-screen" style={{ background: '#f8fafc' }}>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: '260px', background: '#800020', flexShrink: 0, boxShadow: '4px 0 15px rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-center justify-between" style={{ padding: '24px 20px', height: '80px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-white p-1" style={{ width: '42px', height: '42px' }}>
              <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>QA Portal</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Central University</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto" style={{ padding: '24px 12px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', padding: '0 12px', marginBottom: '12px', textTransform: 'uppercase' }}>Main Menu</p>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-xl transition-all"
                style={{
                  padding: '12px 14px', marginBottom: '4px',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none', fontSize: '14px', fontWeight: isActive ? 600 : 500,
                  borderLeft: isActive ? '4px solid #ffffff' : '4px solid transparent'
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">{user?.full_name?.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', margin: 0 }}>{user?.full_name}</p>
              <p className="truncate" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full p-2 text-white/60 hover:text-white transition-colors border-none bg-transparent cursor-pointer text-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-white border-b border-slate-200 px-6 h-16 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500"><Menu size={20} /></button>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{currentPage?.name || 'Dashboard'}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, width: '320px', background: '#ffffff',
                  border: '1px solid #e2e8f0', borderRadius: '16px', marginTop: '12px', zIndex: 100,
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                  overflow: 'hidden'
                }}>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Notifications</p>
                    <button onClick={markAllAsRead} style={{ fontSize: '11px', color: '#800020', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Mark all as read</button>
                  </div>
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell size={24} className="mx-auto text-slate-200 mb-2" />
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No new notifications</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border-b border-slate-50 transition-colors ${!notif.read ? 'bg-slate-50/50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                              {notif.type === 'success' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                            </div>
                            <div className="flex-1">
                              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 2px' }}>{notif.title}</p>
                              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px', lineHeight: 1.4 }}>{notif.message}</p>
                              <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 text-center">
                    <button onClick={() => navigate('/qa/responses')} className="text-[12px] font-semibold color-[#800020] border-none bg-transparent cursor-pointer">View All Activity</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 lg:hidden bg-black/40" />}
    </div>
  )
}
