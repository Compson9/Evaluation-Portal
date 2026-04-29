import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { QAUser } from '../types/database.types'

interface AuthContextType {
  user: QAUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (userData: QAUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<QAUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('qa_user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as QAUser
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('qa_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData: QAUser) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('qa_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('qa_user')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}