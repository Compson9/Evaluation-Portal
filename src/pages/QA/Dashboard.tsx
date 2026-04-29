import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Building2,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  type LucideIcon
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface MenuItem {
  name: string
  path: string
  icon: LucideIcon
}

export default function QADashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/qa/dashboard', icon: LayoutDashboard },
    { name: 'Forms', path: '/qa/forms', icon: FileText },
    { name: 'Courses', path: '/qa/courses', icon: BookOpen },
    { name: 'Lecturers', path: '/qa/lecturers', icon: Users },
    { name: 'Departments', path: '/qa/departments', icon: Building2 },
    { name: 'Analytics', path: '/qa/analytics', icon: BarChart3 },
  ]

  const handleLogout = () => {
    logout()
    navigate('/qa/login')
  }

  const currentPage = menuItems.find(item => item.path === location.pathname)

  return (
    <div className="flex h-screen" style={{ background: '#f0f4ff' }}>

      {/* ===================== SIDEBAR ===================== */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: '220px',
          background: '#1240ab',
          flexShrink: 0
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '20px',
            borderBottom: '0.5px solid rgba(255,255,255,0.1)',
            height: '64px'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: '34px',
                height: '34px',
                background: 'rgba(255,255,255,0.15)'
              }}
            >
              <BookOpen size={16} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', margin: 0 }}>
                QA Portal
              </p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Central University
              </p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={18} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '16px 10px' }}>
          <p
            className="uppercase"
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
              padding: '0 10px',
              marginBottom: '8px'
            }}
          >
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 rounded-lg"
                style={{
                  padding: '9px 10px',
                  marginBottom: '2px',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  transition: 'all 0.15s',
                  borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = '#ffffff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                  }
                }}
              >
                <Icon size={15} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div
          style={{
            padding: '12px 10px',
            borderTop: '0.5px solid rgba(255,255,255,0.1)'
          }}
        >
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{
              padding: '10px',
              background: 'rgba(255,255,255,0.08)',
              marginBottom: '6px'
            }}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {user?.full_name?.charAt(0) || 'Q'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                className="truncate"
                style={{ fontSize: '12px', fontWeight: 500, color: '#ffffff', margin: 0 }}
              >
                {user?.full_name || 'QA Admin'}
              </p>
              <p
                className="truncate"
                style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', margin: 0 }}
              >
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full rounded-lg transition-all"
            style={{
              padding: '8px 10px',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '13px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
              e.currentTarget.style.color = '#fca5a5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT ===================== */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header
          className="flex items-center justify-between flex-shrink-0"
          style={{
            height: '64px',
            background: '#ffffff',
            borderBottom: '0.5px solid #e2e8f0',
            padding: '0 24px'
          }}
        >
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu size={20} color="#64748b" />
            </button>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                {currentPage?.name || 'Dashboard'}
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="hidden md:flex items-center gap-2 rounded-lg"
              style={{
                background: '#f8fafc',
                border: '0.5px solid #e2e8f0',
                padding: '7px 12px'
              }}
            >
              <Search size={13} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  color: '#0f172a',
                  width: '160px'
                }}
              />
            </div>

            <div
              className="relative flex items-center justify-center rounded-lg cursor-pointer"
              style={{
                width: '34px',
                height: '34px',
                background: '#f8fafc',
                border: '0.5px solid #e2e8f0'
              }}
            >
              <Bell size={15} color="#64748b" />
              <div
                className="absolute rounded-full"
                style={{
                  top: '6px',
                  right: '6px',
                  width: '6px',
                  height: '6px',
                  background: '#ef4444',
                  border: '1.5px solid white'
                }}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        />
      )}
    </div>
  )
}