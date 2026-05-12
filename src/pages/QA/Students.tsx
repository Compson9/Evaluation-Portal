import { useState, useEffect } from 'react'
import { Plus, Trash2, User, BookOpen, Search, X, Check, Link as LinkIcon, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type Student, type Department } from '../../types/database.types'

interface CourseAssignmentWithDetails {
  id: string
  semester: string
  year: number
  session: string
  courses: { code: string; title: string; level: number }
  lecturers: { full_name: string }
}

interface StudentWithDetails extends Student {
  departments?: { name: string } | null
  student_enrollments: {
    id: string
    course_assignments: CourseAssignmentWithDetails
  }[]
}

export default function Students() {
  const [students, setStudents] = useState<StudentWithDetails[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [allAssignments, setAllAssignments] = useState<CourseAssignmentWithDetails[]>([])
  
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [form, setForm] = useState({
    index_number: '',
    full_name: '',
    department_id: '',
    level: '100'
  })

  // For enroll modal
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [{ data: studentData }, { data: deptData }, { data: assignData }] = await Promise.all([
        supabase
          .from('students')
          .select(`
            *,
            departments ( name ),
            student_enrollments (
              id,
              course_assignments (
                id, semester, year, session,
                courses ( code, title, level ),
                lecturers ( full_name )
              )
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('name'),
        supabase
          .from('course_assignments')
          .select(`
            id, semester, year, session,
            courses ( code, title, level ),
            lecturers ( full_name )
          `)
          .order('created_at', { ascending: false })
      ])

      setStudents((studentData as any) || [])
      setDepartments(deptData || [])
      setAllAssignments((assignData as any) || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    }
    setLoading(false)
  }

  async function saveStudent() {
    if (!form.index_number.trim() || !form.full_name.trim() || !form.department_id) {
      setError('Index Number, Full Name, and Department are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          index_number: form.index_number.trim().toUpperCase(),
          full_name: form.full_name.trim(),
          department_id: form.department_id,
          level: parseInt(form.level)
        })

      if (insertError) throw insertError

      await fetchData()
      setShowModal(false)
      setForm({ index_number: '', full_name: '', department_id: '', level: '100' })
    } catch (err: any) {
      setError(err.message || 'Error saving student. Index number may already exist.')
    }
    setSaving(false)
  }

  async function deleteStudent(id: string) {
    if (!confirm('Are you sure you want to delete this student? This will delete all their enrollments and evaluation responses!')) return

    try {
      const { error: deleteError } = await supabase.from('students').delete().eq('id', id)
      if (deleteError) throw deleteError
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      console.error('Error deleting student:', err)
      alert(`Failed to delete student: ${err.message}`)
    }
  }

  async function enrollStudent(studentId: string) {
    if (!selectedAssignmentId) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: studentId,
          course_assignment_id: selectedAssignmentId
        })
        
      if (error) {
        if (error.code === '23505') throw new Error('Student is already enrolled in this course.')
        throw error
      }
      
      await fetchData()
      setShowEnrollModal(null)
      setSelectedAssignmentId('')
    } catch (err: any) {
      alert(err.message || 'Failed to enroll student')
    }
    setSaving(false)
  }

  async function unenrollStudent(enrollmentId: string) {
    if (!confirm('Remove student from this course?')) return
    try {
      const { error } = await supabase.from('student_enrollments').delete().eq('id', enrollmentId)
      if (error) throw error
      await fetchData()
    } catch (err: any) {
      alert(`Failed to remove enrollment: ${err.message}`)
    }
  }

  const filteredStudents = students.filter(s => 
    s.index_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Students & Enrollments
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Manage student records and tie them to course evaluations.
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setForm({ index_number: '', full_name: '', department_id: '', level: '100' }) }}
          style={{
            padding: '8px 16px', background: '#800020', border: 'none',
            borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#ffffff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Plus size={16} />
          Add Student
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search students by index number or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '12px 12px 12px 40px', background: '#ffffff',
            border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px',
            color: '#0f172a', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}
        />
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-2 border-[#800020] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <User size={32} color="#cbd5e1" className="mx-auto mb-3" />
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No students found.</p>
          </div>
        ) : (
          filteredStudents.map(student => (
            <div key={student.id} style={{
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '12px', padding: '20px', display: 'flex',
              flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              {/* Student Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0">
                    <User size={20} color="#64748b" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
                      {student.full_name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#800020', background: '#fdf2f2', padding: '2px 8px', borderRadius: '4px' }}>
                        {student.index_number}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Level {student.level} • {student.departments?.name || 'Unknown Dept'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEnrollModal(student.id)}
                    style={{
                      padding: '6px 12px', background: '#f1f5f9', border: 'none',
                      borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#475569',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                    className="hover:bg-[#e2e8f0]"
                  >
                    <LinkIcon size={14} />
                    Enroll in Course
                  </button>
                  <button
                    onClick={() => deleteStudent(student.id)}
                    style={{
                      padding: '6px', background: '#fef2f2', border: 'none',
                      borderRadius: '6px', color: '#ef4444', cursor: 'pointer'
                    }}
                    className="hover:bg-[#fee2e2]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Enrollments */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Enrolled Courses ({student.student_enrollments?.length || 0})
                </h4>
                
                {student.student_enrollments?.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
                    Student is not enrolled in any courses yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {student.student_enrollments.map(enr => (
                      <div key={enr.id} style={{
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px',
                        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '12px',
                        fontSize: '13px'
                      }}>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{enr.course_assignments.courses.code}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{enr.course_assignments.lecturers.full_name}</span>
                        </div>
                        <button 
                          onClick={() => unenrollStudent(enr.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
                          className="hover:color-[#ef4444]"
                          title="Remove from course"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Add New Student</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Index Number</label>
                <input 
                  type="text" value={form.index_number} onChange={e => setForm({...form, index_number: e.target.value})}
                  placeholder="e.g. INT/22/01/0000"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Full Name</label>
                <input 
                  type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Department</label>
                  <select 
                    value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                  >
                    <option value="">Select Dept...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Level</label>
                  <select 
                    value={form.level} onChange={e => setForm({...form, level: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none' }}
                  >
                    <option value="100">Level 100</option>
                    <option value="200">Level 200</option>
                    <option value="300">Level 300</option>
                    <option value="400">Level 400</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: 'none', borderRadius: '8px' }}>Cancel</button>
              <button onClick={saveStudent} disabled={saving} style={{ padding: '8px 16px', background: '#800020', color: 'white', border: 'none', borderRadius: '8px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Enroll Student in Course</h2>
              <button onClick={() => setShowEnrollModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Select Course Assignment</label>
                <select 
                  value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
                >
                  <option value="">Select a course / lecturer...</option>
                  {allAssignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.courses.code} - {a.courses.title} (by {a.lecturers.full_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowEnrollModal(null)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: 'none', borderRadius: '8px' }}>Cancel</button>
              <button onClick={() => enrollStudent(showEnrollModal)} disabled={saving || !selectedAssignmentId} style={{ padding: '8px 16px', background: '#800020', color: 'white', border: 'none', borderRadius: '8px', opacity: (saving || !selectedAssignmentId) ? 0.5 : 1 }}>
                {saving ? 'Enrolling...' : 'Enroll Student'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
