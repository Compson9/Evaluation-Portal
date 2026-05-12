import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, ChevronLeft, Star, Layers, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type FormQuestion, type Student } from '../../types/database.types'
import logo from '../../assets/logo.png'

interface Answer {
  question_id: string
  rating_value: number | null
  text_value: string | null
}

export default function StudentEvaluation() {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  
  const [student, setStudent] = useState<Student | null>(null)
  const [activeForm, setActiveForm] = useState<{ id: string; title: string } | null>(null)
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null)
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})

  useEffect(() => {
    const session = localStorage.getItem('student_session')
    if (!session || !assignmentId) {
      navigate('/')
      return
    }
    setStudent(JSON.parse(session))
    fetchEvaluationData(assignmentId)
  }, [navigate, assignmentId])

  async function fetchEvaluationData(targetAssignmentId: string) {
    try {
      // 1. Fetch active form & questions
      const { data: formData, error: formError } = await supabase
        .from('evaluation_forms')
        .select('id, title')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (formError || !formData) throw new Error('No active evaluation form found.')
      setActiveForm(formData)

      const { data: questionData } = await supabase
        .from('form_questions')
        .select('*')
        .eq('form_id', formData.id)
        .order('order_index')

      setQuestions(questionData || [])

      // 2. Fetch specific assignment details
      const { data: assignData } = await supabase
        .from('course_assignments')
        .select(`
          id, semester, year, session,
          courses ( code, title ),
          lecturers ( full_name )
        `)
        .eq('id', targetAssignmentId)
        .maybeSingle()
        
      if (!assignData) throw new Error('Course assignment not found.')
      setAssignmentDetails(assignData)

    } catch (err: any) {
      setError(err.message || 'Error loading evaluation.')
    }
    setLoading(false)
  }

  async function handleSubmit() {
    setError('')

    const ratingQuestions = questions.filter(q => q.question_type === 'rating')
    const unanswered = ratingQuestions.filter(q => !answers[q.id]?.rating_value)

    if (unanswered.length > 0) {
      setError('Please answer all rating questions before submitting.')
      window.scrollTo(0, 0)
      return
    }

    setSubmitting(true)

    try {
      // Ensure no duplicates exist first (just in case they clicked back or refreshed)
      const { data: existing } = await supabase
        .from('student_responses')
        .select('id')
        .eq('student_id', student!.id)
        .eq('course_assignment_id', assignmentId)
        .eq('form_id', activeForm!.id)
        .maybeSingle()

      if (existing) {
        navigate('/pending')
        return
      }

      // Insert Response
      const { data: responseData, error: responseError } = await supabase
        .from('student_responses')
        .insert({
          student_id: student!.id,
          department_id: student!.department_id,
          level: student!.level,
          course_assignment_id: assignmentId,
          form_id: activeForm!.id
        })
        .select()
        .single()

      if (responseError) throw responseError

      // Insert Answers
      const answersToInsert = Object.values(answers).map(ans => ({
        response_id: responseData.id,
        question_id: ans.question_id,
        rating_value: ans.rating_value,
        text_value: ans.text_value
      }))

      if (answersToInsert.length > 0) {
        const { error: answersError } = await supabase
          .from('response_answers')
          .insert(answersToInsert)

        if (answersError) {
          // Cleanup response if answers fail
          await supabase.from('student_responses').delete().eq('id', responseData.id)
          throw answersError
        }
      }

      // Automatically go back to pending evaluations
      navigate('/pending')
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation. Please try again.')
      setSubmitting(false)
    }
  }

  function setRating(questionId: string, value: number) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { question_id: questionId, rating_value: value, text_value: null }
    }))
  }

  function setText(questionId: string, value: string) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { question_id: questionId, rating_value: null, text_value: value }
    }))
  }

  const sections = Array.from(new Set(questions.map(q => q.section)))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#800020] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <AlertCircle size={48} color="#ef4444" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Form</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/pending')}
            className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* Header */}
      <header style={{ background: '#ffffff', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={() => navigate('/pending')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', fontWeight: 500, cursor: 'pointer' }}
          >
            <ChevronLeft size={18} /> Back to Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logo} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Assignment Details Header */}
        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Course Evaluation Form</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{assignmentDetails?.courses?.code} - {assignmentDetails?.courses?.title}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lecturer</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{assignmentDetails?.lecturers?.full_name}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semester</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{assignmentDetails?.semester} {assignmentDetails?.year}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{assignmentDetails?.session}</p>
            </div>
          </div>
        </div>

        {/* Form Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {sections.map(section => {
            const sectionQuestions = questions.filter(q => q.section === section)
            return (
              <div key={section} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="#800020" />
                    {section}
                  </h3>
                </div>
                
                <div style={{ padding: '0 24px' }}>
                  {sectionQuestions.map((q, idx) => (
                    <div key={q.id} style={{ padding: '24px 0', borderBottom: idx < sectionQuestions.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: '#334155', margin: '0 0 16px', lineHeight: 1.5 }}>
                        {idx + 1}. {q.question_text}
                      </p>

                      {q.question_type === 'rating' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          {[1, 2, 3, 4, 5].map(val => (
                            <button
                              key={val}
                              onClick={() => setRating(q.id, val)}
                              style={{
                                width: '48px', height: '48px',
                                borderRadius: '12px',
                                border: answers[q.id]?.rating_value === val ? '2px solid #800020' : '1px solid #e2e8f0',
                                background: answers[q.id]?.rating_value === val ? '#fdf2f2' : '#ffffff',
                                color: answers[q.id]?.rating_value === val ? '#800020' : '#64748b',
                                fontSize: '16px', fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {val}
                            </button>
                          ))}
                          <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>
                            {['', 'Poor', 'Satisfactory', 'Good', 'Very Good', 'Excellent'][answers[q.id]?.rating_value || 0]}
                          </span>
                        </div>
                      ) : (
                        <textarea
                          placeholder="Type your answer here..."
                          value={answers[q.id]?.text_value || ''}
                          onChange={(e) => setText(q.id, e.target.value)}
                          style={{
                            width: '100%', minHeight: '120px', padding: '16px',
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                            borderRadius: '12px', fontSize: '14px', color: '#0f172a',
                            resize: 'vertical', outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '16px 32px',
              background: '#800020',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#ffffff',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: submitting ? 0.7 : 1,
              transition: 'background 0.2s'
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
            {!submitting && <Send size={18} />}
          </button>
        </div>

      </main>
    </div>
  )
}
