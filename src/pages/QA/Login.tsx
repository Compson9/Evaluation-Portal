import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowRight, Shield, Layers } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { QAUser } from '../../types/database.types'

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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0c2340 50%, #0a1628 100%)' }}
    >
      {/* Glowing orbs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />
      <div
        className="absolute top-1/2 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.08) 0%, transparent 70%)', transform: 'translateY(-50%)' }}
      />

      {/* Card */}
      <div className="w-full max-w-md relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              boxShadow: '0 0 40px rgba(37,99,235,0.5)'
            }}
          >
            <Layers className="text-white" size={30} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            QA Evaluation Portal
          </h1>
          <p style={{ color: '#93c5fd' }} className="text-sm font-medium">
            Student Assessment System — Central University
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(255,255,255,0.12)'
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
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#93c5fd' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#60a5fa' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="qa@university.edu.gh"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl outline-none text-sm transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    color: '#e2e8f0',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '0.5px solid rgba(96,165,250,0.6)'
                    e.target.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '0.5px solid rgba(255,255,255,0.15)'
                    e.target.style.background = 'rgba(255,255,255,0.06)'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#93c5fd' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#60a5fa' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl outline-none text-sm transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '0.5px solid rgba(255,255,255,0.15)',
                    color: '#e2e8f0',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '0.5px solid rgba(96,165,250,0.6)'
                    e.target.style.background = 'rgba(255,255,255,0.08)'
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '0.5px solid rgba(255,255,255,0.15)'
                    e.target.style.background = 'rgba(255,255,255,0.06)'
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
                background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                boxShadow: '0 4px 24px rgba(37,99,235,0.4)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(37,99,235,0.6)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.4)'
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
                background: 'rgba(37,99,235,0.1)',
                border: '0.5px solid rgba(37,99,235,0.25)'
              }}
            >
              <Shield size={15} style={{ color: '#60a5fa', flexShrink: 0 }} />
              <p className="text-xs" style={{ color: '#93c5fd' }}>
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