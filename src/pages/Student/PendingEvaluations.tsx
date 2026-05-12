import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, BookOpen, User, CheckCircle2, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type Student } from '../../types/database.types'
import logo from '../../assets/logo.png'

interface PendingAssignment {
  id: string // course_assignment_id
  courses: { code: string; title: string }
  lecturers: { full_name: string }
}

export default function PendingEvaluations() {
  const [student, setStudent] = useState<Student | null>(null)
  const [pending, setPending] = useState<PendingAssignment[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeFormId, setActiveFormId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const session = localStorage.getItem('student_session')
    if (!session) {
      navigate('/')
      return
    }
    const parsed = JSON.parse(session)
    setStudent(parsed)
    fetchPendingData(parsed.id)
  }, [navigate])

  async function fetchPendingData(studentId: string) {
    setLoading(true)
    try {
      // 1. Get active form
      const { data: form } = await supabase
        .from('evaluation_forms')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (!form) {
        setLoading(false)
        return // No active form
      }
      setActiveFormId(form.id)

      // 2. Get enrollments
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select(`
          course_assignment_id,
          course_assignments (
            id,
            courses ( code, title ),
            lecturers ( full_name )
          )
        `)
        .eq('student_id', studentId)

      // 3. Get existing responses
      const { data: responses } = await supabase
        .from('student_responses')
        .select('course_assignment_id')
        .eq('student_id', studentId)
        .eq('form_id', form.id)

      const respondedIds = new Set(responses?.map(r => r.course_assignment_id) || [])
      
      const allEnrollments = enrollments || []
      const pendingList: PendingAssignment[] = []

      for (const enr of allEnrollments) {
        if (!respondedIds.has(enr.course_assignment_id)) {
          pendingList.push((enr.course_assignments as any) as PendingAssignment)
        }
      }

      setPending(pendingList)
      setTotalCount(allEnrollments.length)
      setCompletedCount(respondedIds.size)

      // Auto redirect to results if 100% complete
      if (allEnrollments.length > 0 && pendingList.length === 0) {
        navigate('/results')
      }

    } catch (err) {
      console.error('Error fetching pending evaluations:', err)
    }
    setLoading(false)
  }

  function handleEvaluate(assignmentId: string) {
    // Navigate to evaluation form with the specific assignment ID
    navigate(`/evaluate/${assignmentId}?formId=${activeFormId}`)
  }

  function handleLogout() {
    localStorage.removeItem('student_session')
    navigate('/')
  }

  if (!student) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px' }}>
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#800020', margin: 0 }}>
            Pending Evaluations
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right', display: 'none', '@media (min-width: 640px)': { display: 'block' } } as any}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{student.full_name}</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{student.index_number}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-2 border-[#800020] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activeFormId ? (
          <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <FileText size={48} color="#cbd5e1" className="mx-auto mb-4" />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>No Active Evaluations</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>There are currently no evaluation forms active for this semester.</p>
            <button onClick={() => navigate('/results')} style={{ padding: '12px 24px', background: '#800020', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Continue to Results
            </button>
          </div>
        ) : pending.length === 0 && totalCount === 0 ? (
          <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <AlertCircle size={48} color="#cbd5e1" className="mx-auto mb-4" />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>No Course Enrollments</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>You are not enrolled in any courses for the current evaluation period.</p>
            <button onClick={() => navigate('/results')} style={{ padding: '12px 24px', background: '#800020', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Continue to Results
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px', marginBottom: '32px', display: 'flex', gap: '16px' }}>
              <AlertCircle size={24} color="#d97706" className="flex-shrink-0" />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>Action Required</h3>
                <p style={{ fontSize: '14px', color: '#b45309', margin: 0, lineHeight: 1.5 }}>
                  You must complete your course and lecturer evaluations before you can access your mock exam results. 
                  You have completed {completedCount} out of {totalCount} assigned evaluations.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {pending.map(assignment => (
                <div key={assignment.id} style={{ 
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', 
                  padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div className="w-12 h-12 rounded-xl bg-[#fdf2f2] flex items-center justify-center flex-shrink-0 mt-1">
                      <BookOpen size={24} color="#800020" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>
                        {assignment.courses.title}
                      </h4>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 500, color: '#475569' }}>{assignment.courses.code}</span>
                      </p>
                      <p style={{ fontSize: '14px', color: '#475569', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} /> Lecturer: <span style={{ fontWeight: 500 }}>{assignment.lecturers.full_name}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleEvaluate(assignment.id)}
                    style={{
                      padding: '12px 24px', background: '#800020', border: 'none', borderRadius: '8px',
                      color: '#ffffff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0
                    }}
                  >
                    Evaluate Now <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
