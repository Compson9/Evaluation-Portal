import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, ChevronRight, Star, Layers } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { type Programme, type FormQuestion } from '../../types/database.types'
import logo from '../../assets/logo.png'


interface CourseAssignmentOption {
  id: string
  semester: string
  year: number
  session: string
  courses: { code: string; title: string; level: number }
  lecturers: { full_name: string; title: string | null }
}

interface Answer {
  question_id: string
  rating_value: number | null
  text_value: string | null
}

type Step = 'info' | 'form' | 'success'

export default function StudentEvaluation() {
  const [step, setStep] = useState<Step>('info')
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [assignments, setAssignments] = useState<CourseAssignmentOption[]>([])
  const [activeForm, setActiveForm] = useState<{ id: string; title: string } | null>(null)
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [studentInfo, setStudentInfo] = useState({
    student_id: '',
    programme_id: '',
    level: '100',
    course_assignment_id: ''
  })

  const [answers, setAnswers] = useState<Record<string, Answer>>({})

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    try {
      const [
        { data: progData },
        { data: assignData },
        { data: formData }
      ] = await Promise.all([
        supabase.from('programmes').select('*').order('name'),
        supabase
          .from('course_assignments')
          .select('id, semester, year, session, courses(code, title, level), lecturers(full_name, title)')
          .order('created_at', { ascending: false }),
        supabase
          .from('evaluation_forms')
          .select('id, title')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
      ])

      setProgrammes(progData || [])
      setAssignments((assignData as any) || [])

      if (formData) {
        setActiveForm(formData)
        const { data: questionData } = await supabase
          .from('form_questions')
          .select('*')
          .eq('form_id', formData.id)
          .order('order_index')

        setQuestions(questionData || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    }
    setLoading(false)
  }

  async function checkDuplicate(): Promise<boolean> {
    if (!activeForm) return false

    const { data } = await supabase
      .from('student_responses')
      .select('id')
      .eq('student_id', studentInfo.student_id)
      .eq('course_assignment_id', studentInfo.course_assignment_id)
      .eq('form_id', activeForm.id)
      .maybeSingle()

    return !!data
  }

  async function handleInfoSubmit() {
    setError('')

    if (!studentInfo.student_id.trim()) {
      setError('Please enter your student ID')
      return
    }
    if (!studentInfo.programme_id) {
      setError('Please select your programme')
      return
    }
    if (!studentInfo.course_assignment_id) {
      setError('Please select a course')
      return
    }
    if (!activeForm) {
      setError('No active evaluation form found. Please contact QA.')
      return
    }

    const isDuplicate = await checkDuplicate()
    if (isDuplicate) {
      setError('You have already submitted an evaluation for this course.')
      return
    }

    setStep('form')
    window.scrollTo(0, 0)
  }

  async function handleSubmit() {
    setError('')

    const ratingQuestions = questions.filter(q => q.question_type === 'rating')
    const unanswered = ratingQuestions.filter(q => !answers[q.id]?.rating_value)

    if (unanswered.length > 0) {
      setError('Please answer all rating questions before submitting.')
      return
    }

    setSubmitting(true)

    try {
      const { data: responseData, error: responseError } = await supabase
        .from('student_responses')
        .insert({
          student_id: studentInfo.student_id.trim(),
          programme_id: studentInfo.programme_id,
          level: parseInt(studentInfo.level),
          course_assignment_id: studentInfo.course_assignment_id,
          form_id: activeForm!.id
        })
        .select()
        .single()

      if (responseError) throw responseError

      const answersToInsert = questions.map(q => ({
        response_id: responseData.id,
        question_id: q.id,
        rating_value: answers[q.id]?.rating_value || null,
        text_value: answers[q.id]?.text_value || null
      }))

      const { error: answersError } = await supabase
        .from('response_answers')
        .insert(answersToInsert)

      if (answersError) throw answersError

      setStep('success')
      window.scrollTo(0, 0)
    } catch (err: any) {
      setError(err.message || 'Error submitting evaluation. Please try again.')
    }

    setSubmitting(false)
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

  const sections = [...new Set(questions.map(q => q.section))]
  const selectedAssignment = assignments.find(a => a.id === studentInfo.course_assignment_id)

  // ======================== LOADING ========================
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f8f9fa' }}
      >
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid #e2e8f0',
          borderTop: '2px solid #800020',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  // ======================== SUCCESS ========================
  if (step === 'success') {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: '#f8f9fa' }}
      >
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
          border: '0.5px solid #e2e8f0',
          padding: '48px 32px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center'
        }}>
          <div
            className="flex items-center justify-center rounded-full mx-auto"
            style={{
              width: '80px', height: '80px',
              background: '#fdf2f2',
              marginBottom: '20px'
            }}
          >
            <CheckCircle size={40} color="#800020" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: '0 0 12px' }}>
            Submission Successful!
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
            Thank you for your valuable feedback. Your response has been recorded anonymously and will help improve our academic standards.
          </p>
          <button
            onClick={() => {
              setStep('info')
              setAnswers({})
              setStudentInfo({ student_id: '', programme_id: '', level: '100', course_assignment_id: '' })
            }}
            style={{
              padding: '12px 32px',
              background: '#800020',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(128,0,32,0.2)'
            }}
          >
            Submit Another Evaluation
          </button>
        </div>
      </div>
    )
  }

  // ======================== INFO STEP ========================
  if (step === 'info') {
    return (
      <div
        className="min-h-screen"
        style={{ background: '#f8f9fa' }}
      >
        {/* Top Bar */}
        <div style={{
          background: '#800020',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div
            className="flex items-center justify-center rounded-lg overflow-hidden"
            style={{ width: '36px', height: '36px', background: '#ffffff', padding: '4px' }}
          >
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="flex flex-col">
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
              Student Evaluation Portal
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '-2px' }}>
              Central University
            </span>
          </div>
        </div>

        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#0f172a', margin: '0 0 6px' }}>
              Student Assessment of Teaching and Courses
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Your candid and objective appraisal will go a long way in enhancing the quality of the programme. All responses are anonymous.
            </p>
          </div>

          {/* Info Card */}
          <div style={{
            background: '#ffffff',
            border: '0.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: '0 0 16px' }}>
              Your Information
            </p>

            {error && (
              <div style={{
                padding: '10px 12px',
                background: '#fef2f2',
                border: '0.5px solid #fecaca',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ef4444',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Student ID */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Student ID / Index Number
                </label>
                <input
                  type="text"
                  value={studentInfo.student_id}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, student_id: e.target.value }))}
                  placeholder="e.g. CU/2023/001"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Programme */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Programme
                </label>
                <select
                  value={studentInfo.programme_id}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, programme_id: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select your programme</option>
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Level */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Level
                </label>
                <select
                  value={studentInfo.level}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, level: e.target.value }))}
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

              {/* Course */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Course & Lecturer
                </label>
                <select
                  value={studentInfo.course_assignment_id}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, course_assignment_id: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#f8fafc', border: '0.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '13px',
                    color: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select course</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      {(a as any).courses?.code} — {(a as any).courses?.title} ({(a as any).lecturers?.title} {(a as any).lecturers?.full_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Info */}
              {selectedAssignment && (
                <div style={{
                  padding: '10px 12px',
                  background: '#fdf2f2',
                  border: '0.5px solid #fecaca',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontSize: '11px', color: '#800020', margin: '0 0 2px', fontWeight: 500 }}>
                    Selected Course Details
                  </p>
                  <p style={{ fontSize: '12px', color: '#800020', margin: 0 }}>
                    {(selectedAssignment as any).semester} {selectedAssignment.year} · {selectedAssignment.session} Session
                  </p>
                </div>
              )}

              <button
                onClick={handleInfoSubmit}
                className="flex items-center justify-center gap-2 group transition-all"
                style={{
                  width: '100%', padding: '14px',
                  background: '#800020', border: 'none',
                  borderRadius: '10px', fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff', cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(128,0,32,0.15)'
                }}
              >
                Continue to Evaluation
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>
            © 2026 Central University · Student Evaluation System
          </p>
        </div>
      </div>
    )
  }

  // ======================== FORM STEP ========================
  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>

      {/* Top Bar */}
      <div style={{
        background: '#800020',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-lg overflow-hidden"
            style={{ width: '36px', height: '36px', background: '#ffffff', padding: '4px' }}
          >
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
            Evaluation Form
          </span>
        </div>
        <button
          onClick={() => setStep('info')}
          style={{
            fontSize: '12px', color: 'rgba(255,255,255,0.6)',
            background: 'none', border: 'none', cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Form Info */}
        <div style={{
          background: '#800020',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 4px 15px rgba(128,0,32,0.1)'
        }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 4px' }}>
            {activeForm?.title}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            {(selectedAssignment as any)?.courses?.title} —{' '}
            {(selectedAssignment as any)?.lecturers?.title}{' '}
            {(selectedAssignment as any)?.lecturers?.full_name}
          </p>
        </div>

        {/* Rating Key */}
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <p style={{ fontSize: '11px', fontWeight: 500, color: '#64748b', margin: 0 }}>
            Rating Key:
          </p>
          {[['5', 'Excellent'], ['4', 'Very Good'], ['3', 'Good'], ['2', 'Satisfactory'], ['1', 'Poor']].map(([n, l]) => (
            <div key={n} className="flex items-center gap-1">
              <span style={{
                width: '20px', height: '20px',
                background: '#800020', color: '#fff',
                borderRadius: '50%', fontSize: '11px',
                fontWeight: 600, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                {n}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 12px',
            background: '#fef2f2',
            border: '0.5px solid #fecaca',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#ef4444',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Questions by Section */}
        {sections.map(section => (
          <div
            key={section}
            style={{
              background: '#ffffff',
              border: '0.5px solid #e2e8f0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}
          >
            {/* Section Header */}
            <div style={{
              background: '#f8faff',
              borderBottom: '0.5px solid #e2e8f0',
              padding: '10px 16px'
            }}>
              <p style={{
                fontSize: '11px', fontWeight: 600,
                color: '#800020', textTransform: 'uppercase',
                letterSpacing: '0.08em', margin: 0
              }}>
                {section}
              </p>
            </div>

            {/* Questions */}
            <div style={{ padding: '8px 0' }}>
              {questions
                .filter(q => q.section === section)
                .map((question, qi) => (
                  <div
                    key={question.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: qi < questions.filter(q => q.section === section).length - 1
                        ? '0.5px solid #f1f5f9' : 'none'
                    }}
                  >
                    <p style={{ fontSize: '13px', color: '#0f172a', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {question.question_text}
                    </p>

                    {question.question_type === 'rating' ? (
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(val => {
                          const isSelected = answers[question.id]?.rating_value === val
                          return (
                            <button
                              key={val}
                              onClick={() => setRating(question.id, val)}
                              style={{
                                width: '36px', height: '36px',
                                borderRadius: '50%',
                                background: isSelected ? '#800020' : '#f8fafc',
                                border: `0.5px solid ${isSelected ? '#800020' : '#e2e8f0'}`,
                                color: isSelected ? '#ffffff' : '#64748b',
                                fontSize: '14px', fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = '#fdf2f2'
                                  e.currentTarget.style.borderColor = '#fecaca'
                                  e.currentTarget.style.color = '#800020'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = '#f8fafc'
                                  e.currentTarget.style.borderColor = '#e2e8f0'
                                  e.currentTarget.style.color = '#64748b'
                                }
                              }}
                            >
                              {val}
                            </button>
                          )
                        })}
                        {answers[question.id]?.rating_value && (
                          <span style={{ fontSize: '11px', color: '#800020', marginLeft: '6px', fontWeight: 500 }}>
                            <Star size={11} fill="#800020" color="#800020" style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                            {['', 'Poor', 'Satisfactory', 'Good', 'Very Good', 'Excellent'][answers[question.id]?.rating_value || 0]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={answers[question.id]?.text_value || ''}
                        onChange={(e) => setText(question.id, e.target.value)}
                        placeholder="Type your response here..."
                        rows={3}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#f8fafc', border: '0.5px solid #e2e8f0',
                          borderRadius: '8px', fontSize: '13px',
                          color: '#0f172a', outline: 'none',
                          boxSizing: 'border-box', resize: 'vertical',
                          fontFamily: 'inherit', lineHeight: 1.5
                        }}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2"
          style={{
            width: '100%', padding: '16px',
            background: '#800020', border: 'none',
            borderRadius: '12px', fontSize: '15px',
            fontWeight: 600, color: '#ffffff',
            cursor: 'pointer', marginTop: '8px',
            opacity: submitting ? 0.7 : 1,
            boxShadow: '0 4px 15px rgba(128,0,32,0.2)',
            transition: 'all 0.2s'
          }}
        >
          {submitting ? (
            <>
              <div style={{
                width: '16px', height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Submit Evaluation
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>
          © 2026 Central University · Student Evaluation System
        </p>
      </div>
    </div>
  )
}
