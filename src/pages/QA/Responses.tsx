import { useState, useEffect } from 'react'
import { Search, Filter, FileText, ChevronDown, User, BookOpen, Calendar, Star, X, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Response {
  id: string
  student_id: string
  submitted_at: string
  level: number
  departments?: { name: string } | null
  course_assignments?: {
    semester: string
    year: number
    session: string
    courses?: { code: string; title: string } | null
    lecturers?: { full_name: string; title: string | null } | null
  } | null
}

interface Answer {
  id: string
  rating_value: number | null
  text_value: string | null
  form_questions: {
    question_text: string
    question_type: string
    section: string
  }
}

export default function Responses() {
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loadingAnswers, setLoadingAnswers] = useState(false)

  // Filters
  const [filterLevel, setFilterLevel] = useState('All')
  const [filterSemester, setFilterSemester] = useState('All')

  useEffect(() => {
    fetchResponses()
  }, [])

  async function fetchResponses() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('student_responses')
        .select(`
          id, student_id, submitted_at, level,
          departments ( name ),
          course_assignments (
            semester, year, session,
            courses ( code, title ),
            lecturers ( full_name, title )
          )
        `)
        .order('submitted_at', { ascending: false })

      if (fetchError) throw fetchError
      
      setResponses(data as any[] || [])
    } catch (err: any) {
      console.error('Error fetching responses:', err)
      setError(err.message || 'Failed to fetch responses.')
    }
    setLoading(false)
  }

  async function viewDetails(response: Response) {
    setSelectedResponse(response)
    setLoadingAnswers(true)
    try {
      const { data, error } = await supabase
        .from('response_answers')
        .select(`
          id, rating_value, text_value,
          form_questions(question_text, question_type, section)
        `)
        .eq('response_id', response.id)

      if (error) throw error
      setAnswers((data as any) || [])
    } catch (err) {
      console.error('Error fetching answers:', err)
    }
    setLoadingAnswers(false)
  }

  const filteredResponses = responses.filter(r => {
    const studentId = r.student_id || ''
    const courseTitle = r.course_assignments?.courses?.title || ''
    const courseCode = r.course_assignments?.courses?.code || ''
    const lecturerName = r.course_assignments?.lecturers?.full_name || ''
    
    const matchesSearch = studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lecturerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = filterLevel === 'All' || r.level?.toString() === filterLevel
    const matchesSemester = filterSemester === 'All' || r.course_assignments?.semester === filterSemester

    return matchesSearch && matchesLevel && matchesSemester
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Evaluation Responses
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            View and manage student feedback
            {responses.length > 0 && (
              <span style={{ color: '#800020', fontWeight: 600, marginLeft: '8px' }}>
                ({filteredResponses.length} of {responses.length} total)
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={fetchResponses}
          style={{ 
            padding: '8px 16px', background: '#ffffff', border: '1px solid #e2e8f0', 
            borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: '#475569', cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', 
          borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px',
          color: '#dc2626', fontSize: '13px'
        }}>
          <AlertCircle size={16} />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div className="relative flex-1">
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by student ID, course, or lecturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px', background: '#f8fafc',
              border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px',
              color: '#0f172a', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} color="#64748b" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            style={{
              padding: '10px 12px', background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '13px', color: '#475569', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="All">All Levels</option>
            <option value="100">Level 100</option>
            <option value="200">Level 200</option>
            <option value="300">Level 300</option>
            <option value="400">Level 400</option>
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            style={{
              padding: '10px 12px', background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '13px', color: '#475569', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="All">All Semesters</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: '300px' }}>
            <div style={{
              width: '32px', height: '32px', border: '2px solid #e2e8f0',
              borderTop: '2px solid #800020', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        ) : filteredResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#fdf2f2] mx-auto mb-4">
              <FileText size={24} color="#800020" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
              {responses.length === 0 ? 'No responses found' : 'No matches found'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {responses.length === 0 
                ? 'Evaluation results will appear here once students submit.' 
                : 'Try adjusting your filters or search term.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Student ID', 'Course', 'Lecturer', 'Submitted On', ''].map(h => (
                  <th key={h} style={{
                    padding: '14px 20px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResponses.map((res) => (
                <tr 
                  key={res.id} 
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  className="hover:bg-[#fdf2f2]"
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                        <User size={14} color="#64748b" />
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{res.student_id}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Level {res.level}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>{res.course_assignments?.courses?.title || 'Unknown'}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{res.course_assignments?.courses?.code || 'N/A'}</p>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{res.course_assignments?.lecturers?.full_name || 'N/A'}</p>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      {new Date(res.submitted_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => viewDetails(res)}
                      style={{
                        padding: '6px 14px', background: '#ffffff', border: '1px solid #e2e8f0',
                        borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#800020', cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {selectedResponse && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setSelectedResponse(null)}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: '700px', borderRadius: '16px', 
            overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', background: '#800020', color: '#ffffff',
              display: 'flex', alignItems: 'center', position: 'relative'
            }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileText size={20} color="#ffffff" />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Evaluation Details</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    {selectedResponse.student_id} • {selectedResponse.course_assignments?.courses?.code || 'N/A'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedResponse(null)}
                style={{
                  position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: '#ffffff'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Info Row */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0'
            }}>
              <div className="flex items-center gap-2">
                <User size={14} color="#94a3b8" />
                <div>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Lecturer</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{selectedResponse.course_assignments?.lecturers?.full_name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} color="#94a3b8" />
                <div>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Semester</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{selectedResponse.course_assignments?.semester || 'N/A'} {selectedResponse.course_assignments?.year || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} color="#94a3b8" />
                <div>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Department</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{selectedResponse.departments?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {loadingAnswers ? (
                <div className="flex items-center justify-center" style={{ height: '200px' }}>
                  <div className="w-8 h-8 border-2 border-[#800020] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : answers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>No answer details found for this submission.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Array.from(new Set(answers.map(a => a.form_questions.section))).map(section => (
                    <div key={section}>
                      <h3 style={{
                        fontSize: '11px', fontWeight: 700, color: '#800020',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        marginBottom: '12px', borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '6px'
                      }}>{section}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {answers.filter(a => a.form_questions.section === section).map(answer => (
                          <div key={answer.id}>
                            <p style={{ fontSize: '13px', color: '#374151', margin: '0 0 8px', lineHeight: 1.5 }}>
                              {answer.form_questions.question_text}
                            </p>
                            {answer.form_questions.question_type === 'rating' ? (
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(val => (
                                  <div 
                                    key={val}
                                    style={{
                                      width: '28px', height: '28px', borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '11px', fontWeight: 600,
                                      background: answer.rating_value === val ? '#800020' : '#f1f5f9',
                                      color: answer.rating_value === val ? '#ffffff' : '#94a3b8'
                                    }}
                                  >
                                    {val}
                                  </div>
                                ))}
                                <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 600, color: '#800020' }}>
                                  {['', 'Poor', 'Satisfactory', 'Good', 'Very Good', 'Excellent'][answer.rating_value || 0]}
                                </span>
                              </div>
                            ) : (
                              <div style={{
                                padding: '12px', background: '#f8fafc',
                                borderRadius: '8px', border: '1px solid #e2e8f0',
                                fontSize: '13px', color: '#4b5563', fontStyle: 'italic'
                              }}>
                                "{answer.text_value || 'No response provided'}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedResponse(null)}
                style={{
                  padding: '10px 20px', background: '#800020', border: 'none',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  color: '#ffffff', cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
