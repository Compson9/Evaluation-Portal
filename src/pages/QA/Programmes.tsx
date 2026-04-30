import { useState, useEffect } from 'react'
import { Plus, Trash2, GraduationCap, X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type Programme, type Department } from '../../types/database.types'

interface ProgrammeWithDept extends Programme {
  departments?: { name: string }
}

export default function Programmes() {
  const [programmes, setProgrammes] = useState<ProgrammeWithDept[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    code: '',
    department_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [{ data: progData }, { data: deptData }] = await Promise.all([
        supabase
          .from('programmes')
          .select('*, departments(name)')
          .order('name'),
        supabase
          .from('departments')
          .select('*')
          .order('name')
      ])

      setProgrammes(progData || [])
      setDepartments(deptData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    }
    setLoading(false)
  }

  async function saveProgramme() {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Name and code are required')
      return
    }
    if (!form.department_id) {
      setError('Please select a department')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('programmes')
        .insert({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          department_id: form.department_id
        })

      if (error) throw error

      await fetchData()
      setShowModal(false)
      setForm({ name: '', code: '', department_id: '' })
    } catch (err: any) {
      setError(err.message || 'Error saving programme')
    }

    setSaving(false)
  }

  async function deleteProgramme(id: string) {
    if (!confirm('Delete this programme? Students using this programme may be affected.')) return

    try {
      await supabase.from('programmes').delete().eq('id', id)
      setProgrammes(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Error deleting programme:', err)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
            Programmes
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
            Manage academic programmes
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setForm({ name: '', code: '', department_id: '' }) }}
          className="flex items-center gap-2"
          style={{
            padding: '8px 16px',
            background: '#800020',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          Add Programme
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{
        background: '#800020',
        borderRadius: '10px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <GraduationCap size={18} color="rgba(255,255,255,0.7)" />
        <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>
          {programmes.length} {programmes.length === 1 ? 'Programme' : 'Programmes'} registered
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '200px' }}>
          <div style={{
            width: '28px', height: '28px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #800020',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      ) : programmes.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e2e8f0',
          borderRadius: '10px',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <div
            className="flex items-center justify-center rounded-xl mx-auto"
            style={{ width: '48px', height: '48px', background: '#fdf2f2', marginBottom: '12px' }}
          >
            <GraduationCap size={22} color="#800020" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: '0 0 4px' }}>
            No programmes yet
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Add your first programme to get started
          </p>
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div className="grid" style={{
            gridTemplateColumns: '120px 1fr 100px 1fr 60px',
            padding: '10px 16px',
            background: '#f8fafc',
            borderBottom: '0.5px solid #e2e8f0'
          }}>
            {['Code', 'Name', 'Department', ''].map(h => (
              <p key={h} style={{
                fontSize: '11px', fontWeight: 500,
                color: '#94a3b8', textTransform: 'uppercase',
                letterSpacing: '0.05em', margin: 0
              }}>
                {h}
              </p>
            ))}
          </div>

          {programmes.map((programme, i) => (
            <div
              key={programme.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '120px 1fr 100px 1fr 60px',
                padding: '12px 16px',
                borderBottom: i < programmes.length - 1 ? '0.5px solid #f1f5f9' : 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8faff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontSize: '12px', fontWeight: 500,
                padding: '3px 10px', borderRadius: '20px',
                background: '#e0e7ff', color: '#800020',
                border: '0.5px solid #c7d2fe',
                display: 'inline-block'
              }}>
                {programme.code}
              </span>

              <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                {programme.name}
              </p>

              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {(programme as any).departments?.name || '—'}
              </p>

              <button
                onClick={() => deleteProgramme(programme.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <Trash2 size={14} color="#ef4444" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            margin: '16px'
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                Add Programme
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#94a3b8" />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px',
                background: '#fef2f2',
                border: '0.5px solid #fecaca',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ef4444',
                marginBottom: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Programme Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. BSc Computer Science"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Programme Code
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. CS-BSC"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Department
                </label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm(prev => ({ ...prev, department_id: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2" style={{ marginTop: '20px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '10px',
                  background: '#f8fafc', border: '0.5px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '13px',
                  color: '#64748b', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveProgramme}
                disabled={saving}
                className="flex items-center justify-center gap-2"
                style={{
                  flex: 1, padding: '10px',
                  background: '#800020', border: 'none',
                  borderRadius: '8px', fontSize: '13px',
                  color: '#ffffff', cursor: 'pointer',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Save size={13} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

