import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowRight, Shield, Layers } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { QAUser } from '../../types/database.types'
import logo from '../../assets/logo.png'


export default function QALogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: queryError } = await supabase
        .from('qa_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (queryError) {
        setError(`Database error: ${queryError.message}`)
        setLoading(false)
        return
      }

      if (!data) {
        setError('No user found with this email address')
        setLoading(false)
        return
      }

      if (data.password_hash === password) {
        login(data as QAUser)
        navigate('/qa/dashboard')
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: '#f8f9fa' }}
    >
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ 
          backgroundImage: `radial-gradient(#800020 0.5px, transparent 0.5px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Card */}
      <div className="w-full max-w-md relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 p-4"
            style={{
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(128,0,32,0.3)',
              border: '1px solid rgba(128,0,32,0.1)'
            }}
          >
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] mb-2 tracking-tight">
            QA Evaluation Portal
          </h1>
          <p style={{ color: '#800020' }} className="text-sm font-semibold uppercase tracking-wide">
            Student Assessment System — Central University
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '0.5px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5'
                }}
              >
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: '#64748b' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#800020' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="qa@university.edu.gh"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl outline-none text-sm transition-all"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #800020'
                    e.target.style.background = '#ffffff'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid #e2e8f0'
                    e.target.style.background = '#f8fafc'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: '#64748b' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#800020' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl outline-none text-sm transition-all"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid #800020'
                    e.target.style.background = '#ffffff'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid #e2e8f0'
                    e.target.style.background = '#f8fafc'
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{
                background: 'linear-gradient(135deg, #800020, #9a1a3a)',
                boxShadow: '0 4px 24px rgba(128,0,32,0.4)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(128,0,32,0.6)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(128,0,32,0.4)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Security Note */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: '#fdf2f2',
                border: '1px solid #fecaca'
              }}
            >
              <Shield size={15} style={{ color: '#800020', flexShrink: 0 }} />
              <p className="text-xs" style={{ color: '#800020', fontWeight: 500 }}>
                Secure access for QA team only. All sessions are encrypted.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
          © 2026 Central University · Student Evaluation System
        </p>
      </div>
    </div>
  )
}
