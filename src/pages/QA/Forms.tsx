import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, Save, FileText, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { EvaluationForm, FormQuestion } from '../../types/database.types'

interface NewQuestion {
  section: string
  question_text: string
  question_type: 'rating' | 'text'
  order_index: number
}

interface FormWithQuestions extends EvaluationForm {
  questions?: FormQuestion[]
}

export default function Forms() {
  const [forms, setForms] = useState<FormWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [questions, setQuestions] = useState<NewQuestion[]>([])
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('Section B')
  const { user } = useAuth()

  const defaultQuestions: NewQuestion[] = [
    { section: 'Course Content', question_text: 'Provision of helpful course outlines', question_type: 'rating', order_index: 0 },
    { section: 'Course Content', question_text: 'Coverage of course content by lecturer', question_type: 'rating', order_index: 1 },
    { section: 'Class Attendance', question_text: 'Regular holding of classes', question_type: 'rating', order_index: 2 },
    { section: 'Class Attendance', question_text: 'Punctuality', question_type: 'rating', order_index: 3 },
    { section: 'Mode of Delivery', question_text: 'Command of the subject matter', question_type: 'rating', order_index: 4 },
    { section: 'Mode of Delivery', question_text: 'Communication of information', question_type: 'rating', order_index: 5 },
    { section: 'Mode of Delivery', question_text: 'Interaction with students in class', question_type: 'rating', order_index: 6 },
    { section: 'Mode of Delivery', question_text: 'Use of class time to promote learning', question_type: 'rating', order_index: 7 },
    { section: 'Mode of Delivery', question_text: 'Promotion of independent study', question_type: 'rating', order_index: 8 },
    { section: 'Mode of Delivery', question_text: 'Promotion of problem solving learning', question_type: 'rating', order_index: 9 },
    { section: 'Assessment', question_text: 'Response to students concerns', question_type: 'rating', order_index: 10 },
    { section: 'Assessment', question_text: 'Adequacy of class assignments', question_type: 'rating', order_index: 11 },
    { section: 'Assessment', question_text: 'Marking and discussion of class assignments', question_type: 'rating', order_index: 12 },
    { section: 'General Feedback', question_text: 'Which aspect of the course did you find most helpful?', question_type: 'text', order_index: 13 },
    { section: 'General Feedback', question_text: 'Which aspects of the course did you find difficult?', question_type: 'text', order_index: 14 },
    { section: 'General Feedback', question_text: 'Which aspect of the course did you dislike most?', question_type: 'text', order_index: 15 },
    { section: 'General Feedback', question_text: 'What suggestions do you have for improving the course?', question_type: 'text', order_index: 16 },
  ]

  useEffect(() => {
    fetchForms()
  }, [])

  async function fetchForms() {
    try {
      const { data, error } = await supabase
        .from('evaluation_forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setForms(data || [])
    } catch (error) {
      console.error('Error fetching forms:', error)
    }
    setLoading(false)
  }

  function openBuilder(useDefault: boolean = false) {
    setFormTitle('')
    setQuestions(useDefault ? defaultQuestions : [])
    setShowBuilder(true)
  }

  function addQuestion() {
    setQuestions(prev => [
      ...prev,
      {
        section: activeSection,
        question_text: '',
        question_type: 'rating',
        order_index: prev.length
      }
    ])
  }

  function updateQuestion(index: number, field: keyof NewQuestion, value: string) {
    setQuestions(prev => prev.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    ))
  }

  function removeQuestion(index: number) {
    setQuestions(prev => prev.filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, order_index: i })))
  }

  async function saveForm() {
    if (!formTitle.trim()) {
      alert('Please enter a form title')
      return
    }
    if (questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    if (!user?.id) {
      alert('User not authenticated. Please log in again.')
      return
    }

    setSaving(true)

    try {
      const { data: formData, error: formError } = await supabase
        .from('evaluation_forms')
        .insert({
          title: formTitle,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single()

      if (formError) {
        console.error('Form insert error:', formError)
        throw new Error(`Failed to create form: ${formError.message}`)
      }

      if (!formData) {
        throw new Error('Form creation returned no data')
      }

      const questionsToInsert = questions.map((q, i) => ({
        form_id: formData.id,
        section: q.section,
        question_text: q.question_text,
        question_type: q.question_type,
        order_index: i
      }))

      const { error: questionsError } = await supabase
        .from('form_questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Questions insert error:', questionsError)
        throw new Error(`Failed to add questions: ${questionsError.message}`)
      }

      alert('Form saved successfully!')
      await fetchForms()
      setShowBuilder(false)
      setFormTitle('')
      setQuestions([])
    } catch (error) {
      console.error('Error saving form:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error saving form: ${errorMessage}`)
    }

    setSaving(false)
  }

  async function toggleFormStatus(formId: string, currentStatus: boolean) {
    try {
      await supabase
        .from('evaluation_forms')
        .update({ is_active: !currentStatus })
        .eq('id', formId)

      setForms(prev => prev.map(f =>
        f.id === formId ? { ...f, is_active: !currentStatus } : f
      ))
    } catch (error) {
      console.error('Error updating form status:', error)
    }
  }

  async function deleteForm(formId: string) {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      const { error: deleteError } = await supabase.from('evaluation_forms').delete().eq('id', formId)

      if (deleteError) {
        console.error('Error deleting form:', deleteError)
        alert(`Failed to delete form: ${deleteError.message}`)
        return
      }

      setForms(prev => prev.filter(f => f.id !== formId))
    } catch (error) {
      console.error('Unexpected error deleting form:', error)
      alert('An unexpected error occurred while deleting the form.')
    }
  }

  const sections = [...new Set(questions.map(q => q.section))]

  if (showBuilder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Builder Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
              Form Builder
            </h1>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
              Build your student evaluation form
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBuilder(false)}
              style={{
                padding: '8px 16px',
                background: '#ffffff',
                border: '0.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveForm}
              disabled={saving}
              className="flex items-center gap-2"
              style={{
                padding: '8px 16px',
                background: '#800020',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#ffffff',
                cursor: 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        </div>

        {/* Form Title */}
        <div
          style={{
            background: '#ffffff',
            border: '0.5px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px'
          }}
        >
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '6px' }}>
            Form Title
          </label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="e.g. Semester 1 - 2026 Lecturer Evaluation"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#f8fafc',
              border: '0.5px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Questions */}
        <div
          style={{
            background: '#ffffff',
            border: '0.5px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px'
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
              Questions ({questions.length})
            </p>
            <div className="flex items-center gap-2">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                style={{
                  padding: '6px 10px',
                  background: '#f8fafc',
                  border: '0.5px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              >
                {['Course Content', 'Class Attendance', 'Mode of Delivery', 'Assessment', 'General Feedback'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2"
                style={{
                  padding: '6px 12px',
                  background: '#fdf2f2',
                  border: '0.5px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#800020',
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                Add Question
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div
                className="flex items-center justify-center rounded-lg mx-auto"
                style={{ width: '40px', height: '40px', background: '#fdf2f2', marginBottom: '10px' }}
              >
                <FileText size={18} color="#800020" />
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px' }}>No questions yet</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Add questions or use the default template</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sections.map(section => (
                <div key={section}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#800020',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '12px 0 6px',
                    padding: '0 4px'
                  }}>
                    {section}
                  </p>
                  {questions
                    .filter(q => q.section === section)
                    .map((q, sectionIndex) => {
                     
                      const actualIndex = questions.indexOf(
                        questions.filter(fq => fq.section === section)[sectionIndex]
                      )

                      return (
                        <div
                          key={actualIndex}
                          className="flex items-start gap-3"
                          style={{
                            padding: '10px 12px',
                            background: '#f8fafc',
                            border: '0.5px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        >
                          <GripVertical size={14} color="#cbd5e1" style={{ marginTop: '3px', flexShrink: 0 }} />

                          <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <input
                              type="text"
                              value={q.question_text}
                              onChange={(e) => updateQuestion(actualIndex, 'question_text', e.target.value)}
                              placeholder="Enter question..."
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                background: '#ffffff',
                                border: '0.5px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: '#0f172a',
                                outline: 'none'
                              }}
                            />

                            <select
                              value={q.question_type}
                              onChange={(e) => updateQuestion(actualIndex, 'question_type', e.target.value)}
                              style={{
                                padding: '6px 8px',
                                background: '#ffffff',
                                border: '0.5px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#0f172a',
                                outline: 'none',
                                flexShrink: 0
                              }}
                            >
                              <option value="rating">Rating (1-5)</option>
                              <option value="text">Text</option>
                            </select>
                          </div>

                          <button
                            onClick={() => removeQuestion(actualIndex)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                          >
                            <X size={14} color="#ef4444" />
                          </button>
                        </div>
                      )
                    })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
            Evaluation Forms
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
            Create and manage student evaluation forms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openBuilder(true)}
            style={{
              padding: '8px 16px',
              background: '#ffffff',
              border: '0.5px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#800020',
              cursor: 'pointer'
            }}
          >
            Use Default Template
          </button>
          <button
            onClick={() => openBuilder(false)}
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
            New Form
          </button>
        </div>
      </div>

      {/* Forms List */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: '200px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #800020',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      ) : forms.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '0.5px solid #e2e8f0',
            borderRadius: '10px',
            padding: '48px 24px',
            textAlign: 'center'
          }}
        >
          <div
            className="flex items-center justify-center rounded-xl mx-auto"
            style={{ width: '48px', height: '48px', background: '#fdf2f2', marginBottom: '12px' }}
          >
            <FileText size={22} color="#800020" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: '0 0 4px' }}>
            No forms yet
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px' }}>
            Create your first evaluation form to get started
          </p>
          <button
            onClick={() => openBuilder(true)}
            style={{
              padding: '8px 20px',
              background: '#800020',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Use Default Template
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {forms.map((form) => (
            <div
              key={form.id}
              className="flex items-center justify-between"
              style={{
                background: '#ffffff',
                border: '0.5px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fecaca'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ width: '36px', height: '36px', background: '#fdf2f2' }}
                >
                  <FileText size={16} color="#800020" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                    {form.title}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                    Created {new Date(form.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: form.is_active ? '#f0fdf4' : '#f8fafc',
                    color: form.is_active ? '#16a34a' : '#94a3b8',
                    border: `0.5px solid ${form.is_active ? '#bbf7d0' : '#e2e8f0'}`
                  }}
                >
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>

                <button
                  onClick={() => toggleFormStatus(form.id, form.is_active)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  {form.is_active
                    ? <ToggleRight size={20} color="#800020" />
                    : <ToggleLeft size={20} color="#94a3b8" />
                  }
                </button>

                <button
                  onClick={() => deleteForm(form.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={15} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
