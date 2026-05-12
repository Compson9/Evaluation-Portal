import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import logo from '../../assets/logo.png'

export default function PortalLogin() {
  const [indexNumber, setIndexNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!indexNumber.trim()) {
      setError('Please enter your index number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .ilike('index_number', indexNumber.trim())
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Student not found. Please check your index number.')

      // Save session in localStorage
      localStorage.setItem('student_session', JSON.stringify(data))
      navigate('/pending')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px' }}>
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#800020', margin: 0 }}>
            Exams Portal
          </h1>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fdf2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <GraduationCap size={32} color="#800020" />
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Student Portal
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px' }}>
            Enter your Index Number to access your mock results and evaluations.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', textAlign: 'left' }}>
                {error}
              </div>
            )}

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Index Number
              </label>
              <input
                type="text"
                placeholder="e.g. CSC/22/01/0000"
                value={indexNumber}
                onChange={(e) => setIndexNumber(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px',
                  color: '#0f172a', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: '#800020', border: 'none',
                borderRadius: '12px', fontSize: '15px', fontWeight: 600, color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', opacity: loading ? 0.8 : 1,
                marginTop: '8px', transition: 'background 0.2s'
              }}
            >
              {loading ? 'Verifying...' : 'Access Portal'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
