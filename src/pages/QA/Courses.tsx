import { useState, useEffect } from 'react'
import { Plus, Trash2, BookOpen, X, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type Course, type Department, type Lecturer } from '../../types/database.types'

interface CourseWithDept extends Course {
  departments?: { name: string }
}

export default function Courses() {
  const [courses, setCourses] = useState<CourseWithDept[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '',
    title: '',
    level: '100',
    department_id: '',
    lecturer_id: '',
    semester: 'Semester 1',
    year: new Date().getFullYear().toString(),
    session: 'Morning'
  })
  const [lecturers, setLecturers] = useState<Lecturer[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [{ data: courseData }, { data: deptData }, { data: lectData }] = await Promise.all([
        supabase
          .from('courses')
          .select('*, departments(name)')
          .order('code'),
        supabase
          .from('departments')
          .select('*')
          .order('name'),
        supabase
          .from('lecturers')
          .select('*')
          .order('full_name')
      ])

      setCourses(courseData || [])
      setDepartments(deptData || [])
      setLecturers(lectData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    }
    setLoading(false)
  }

  async function saveCourse() {
    if (!form.code.trim() || !form.title.trim()) {
      setError('Code and title are required')
      return
    }
    if (!form.department_id) {
      setError('Please select a department')
      return
    }
    if (!form.lecturer_id) {
      setError('Please select a lecturer')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Create the course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          code: form.code.trim().toUpperCase(),
          title: form.title.trim(),
          level: parseInt(form.level),
          department_id: form.department_id
        })
        .select()
        .single()

      if (courseError) throw courseError

      // Create the course assignment (links lecturer to course)
      const { error: assignError } = await supabase
        .from('course_assignments')
        .insert({
          course_id: courseData.id,
          lecturer_id: form.lecturer_id,
          semester: form.semester,
          year: parseInt(form.year),
          session: form.session
        })

      if (assignError) throw assignError

      await fetchData()
      setShowModal(false)
      setForm({ code: '', title: '', level: '100', department_id: '', lecturer_id: '', semester: 'Semester 1', year: new Date().getFullYear().toString(), session: 'Morning' })
    } catch (err: any) {
      setError(err.message || 'Error saving course')
    }

    setSaving(false)
  }

  async function deleteCourse(id: string) {
    if (!confirm('Delete this course?')) return

    try {
      // Delete course assignments first (foreign key constraint)
      await supabase.from('course_assignments').delete().eq('course_id', id)
      
      // Then delete the course
      await supabase.from('courses').delete().eq('id', id)
      
      setCourses(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error deleting course:', err)
    }
  }

  const levelColors: Record<number, { bg: string; color: string; border: string }> = {
    100: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    200: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    300: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    400: { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
            Courses
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
            Manage all university courses
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setForm({ code: '', title: '', level: '100', department_id: '', lecturer_id: '', semester: 'Semester 1', year: new Date().getFullYear().toString(), session: 'Morning' }) }}
          className="flex items-center gap-2"
          style={{
            padding: '8px 16px',
            background: '#1d4ed8',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          Add Course
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{
        background: '#1d4ed8',
        borderRadius: '10px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <BookOpen size={18} color="rgba(255,255,255,0.7)" />
        <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 500 }}>
          {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} registered
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '200px' }}>
          <div style={{
            width: '28px', height: '28px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #1d4ed8',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      ) : courses.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e2e8f0',
          borderRadius: '10px',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <div
            className="flex items-center justify-center rounded-xl mx-auto"
            style={{ width: '48px', height: '48px', background: '#eff6ff', marginBottom: '12px' }}
          >
            <BookOpen size={22} color="#1d4ed8" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: '0 0 4px' }}>
            No courses yet
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Add your first course to get started
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
            {['Code', 'Title', 'Level', 'Department', ''].map(h => (
              <p key={h} style={{
                fontSize: '11px', fontWeight: 500,
                color: '#94a3b8', textTransform: 'uppercase',
                letterSpacing: '0.05em', margin: 0
              }}>
                {h}
              </p>
            ))}
          </div>

          {courses.map((course, i) => {
            const lvl = levelColors[course.level] || levelColors[100]
            return (
              <div
                key={course.id}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '120px 1fr 100px 1fr 60px',
                  padding: '12px 16px',
                  borderBottom: i < courses.length - 1 ? '0.5px solid #f1f5f9' : 'none',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8faff'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{
                  fontSize: '12px', fontWeight: 500,
                  padding: '3px 10px', borderRadius: '20px',
                  background: '#eff6ff', color: '#1d4ed8',
                  border: '0.5px solid #bfdbfe',
                  display: 'inline-block'
                }}>
                  {course.code}
                </span>

                <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                  {course.title}
                </p>

                <span style={{
                  fontSize: '11px', fontWeight: 500,
                  padding: '3px 10px', borderRadius: '20px',
                  background: lvl.bg, color: lvl.color,
                  border: `0.5px solid ${lvl.border}`,
                  display: 'inline-block'
                }}>
                  Level {course.level}
                </span>

                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  {(course as any).departments?.name || '—'}
                </p>

                <button
                  onClick={() => deleteCourse(course.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            )
          })}
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
                Add Course
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
                  Course Code
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. CS201"
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
                  Course Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Data Structures"
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
                  Level
                </label>
                <select
                  value={form.level}
                  onChange={(e) => setForm(prev => ({ ...prev, level: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  {[100, 200, 300, 400].map(l => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
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

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Lecturer
                </label>
                <select
                  value={form.lecturer_id}
                  onChange={(e) => setForm(prev => ({ ...prev, lecturer_id: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Lecturer</option>
                  {lecturers
                    .filter(l => l.department_id === form.department_id)
                    .map(l => (
                      <option key={l.id} value={l.id}>
                        {l.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Semester
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm(prev => ({ ...prev, semester: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 10px',
                      background: '#f8fafc', border: '0.5px solid #e2e8f0',
                      borderRadius: '8px', fontSize: '13px',
                      color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option>Semester 1</option>
                    <option>Semester 2</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm(prev => ({ ...prev, year: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 10px',
                      background: '#f8fafc', border: '0.5px solid #e2e8f0',
                      borderRadius: '8px', fontSize: '13px',
                      color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Session
                  </label>
                  <select
                    value={form.session}
                    onChange={(e) => setForm(prev => ({ ...prev, session: e.target.value }))}
                    style={{
                      width: '100%', padding: '8px 10px',
                      background: '#f8fafc', border: '0.5px solid #e2e8f0',
                      borderRadius: '8px', fontSize: '13px',
                      color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                    <option>Weekend</option>
                  </select>
                </div>
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
                onClick={saveCourse}
                disabled={saving}
                className="flex items-center justify-center gap-2"
                style={{
                  flex: 1, padding: '10px',
                  background: '#1d4ed8', border: 'none',
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