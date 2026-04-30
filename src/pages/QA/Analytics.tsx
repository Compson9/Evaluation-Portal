import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Users, FileText, Download, Search, ExternalLink, Star, X, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface LecturerRating {
  id: string
  name: string
  title: string | null
  average: number
  total: number // This should be total EVALUATIONS, not total answers
}

interface SectionRating {
  section: string
  average: number
}

interface Stats {
  totalEvaluations: number
  totalLecturers: number
  totalCourses: number
  overallAverage: number
}

export default function Analytics() {
  const [stats, setStats] = useState<Stats>({
    totalEvaluations: 0,
    totalLecturers: 0,
    totalCourses: 0,
    overallAverage: 0
  })
  const [lecturerRatings, setLecturerRatings] = useState<LecturerRating[]>([])
  const [sectionRatings, setSectionRatings] = useState<SectionRating[]>([])
  const [comments, setComments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchLecturer, setSearchLecturer] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Basic Totals
      const [
        { count: evaluations },
        { count: lecturerCount },
        { count: courseCount },
        { data: lecturers }
      ] = await Promise.all([
        supabase.from('student_responses').select('id', { count: 'exact', head: true }),
        supabase.from('lecturers').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('lecturers').select('id, full_name, title')
      ])

      // 2. Fetch ALL responses to count evaluations per lecturer
      const { data: allResponses } = await supabase
        .from('student_responses')
        .select('id, course_assignments(lecturer_id)')

      // 3. Fetch ALL rating answers to calculate averages
      const { data: allAnswers } = await supabase
        .from('response_answers')
        .select(`
          rating_value,
          response_id,
          form_questions(section),
          student_responses(course_assignments(lecturer_id))
        `)
        .not('rating_value', 'is', null)

      // 4. Fetch Comments
      const { data: textAnswers } = await supabase
        .from('response_answers')
        .select('text_value')
        .not('text_value', 'is', null)
        .limit(10)

      // Process Stats
      const ratings = allAnswers || []
      const overall = ratings.length > 0
        ? ratings.reduce((sum, a) => sum + (a.rating_value || 0), 0) / ratings.length
        : 0

      setStats({
        totalEvaluations: evaluations || 0,
        totalLecturers: lecturerCount || 0,
        totalCourses: courseCount || 0,
        overallAverage: parseFloat(overall.toFixed(1))
      })

      // Process Section Ratings
      const sectionMap: Record<string, number[]> = {}
      ratings.forEach((a: any) => {
        const section = a.form_questions?.section || 'Unknown'
        if (!sectionMap[section]) sectionMap[section] = []
        sectionMap[section].push(a.rating_value)
      })
      setSectionRatings(Object.entries(sectionMap).map(([section, vals]) => ({
        section: section.length > 15 ? section.substring(0, 15) + '...' : section,
        average: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
      })))

      // Process Lecturer Ratings
      // First, count unique evaluations per lecturer
      const evaluationCountMap: Record<string, number> = {}
      ;(allResponses || []).forEach((r: any) => {
        const lid = r.course_assignments?.lecturer_id
        if (lid) evaluationCountMap[lid] = (evaluationCountMap[lid] || 0) + 1
      })

      // Second, gather all ratings per lecturer
      const lecturerRatingsMap: Record<string, number[]> = {}
      ratings.forEach((a: any) => {
        const lid = a.student_responses?.course_assignments?.lecturer_id
        if (lid) {
          if (!lecturerRatingsMap[lid]) lecturerRatingsMap[lid] = []
          lecturerRatingsMap[lid].push(a.rating_value)
        }
      })

      const lecturerData = (lecturers || []).map(l => {
        const lRatings = lecturerRatingsMap[l.id] || []
        return {
          id: l.id,
          name: l.full_name || 'Unknown',
          title: l.title,
          average: lRatings.length > 0 ? parseFloat((lRatings.reduce((a, b) => a + b, 0) / lRatings.length).toFixed(1)) : 0,
          total: evaluationCountMap[l.id] || 0 // Use unique evaluation count
        }
      }).sort((a, b) => b.average - a.average)
      
      setLecturerRatings(lecturerData)
      setComments((textAnswers || []).map(a => a.text_value).filter(Boolean) as string[])

    } catch (err: any) {
      console.error('Analytics error:', err)
      setError(err.message || 'Failed to load data.')
    }
    setLoading(false)
  }

  const filteredLecturers = lecturerRatings.filter(l => 
    (l.name || '').toLowerCase().includes(searchLecturer.trim().toLowerCase())
  )

  const suggestions = lecturerRatings
    .filter(l => searchLecturer.length >= 2 && l.name.toLowerCase().includes(searchLecturer.toLowerCase()))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '300px' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #e2e8f0', borderTop: '2px solid #800020', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Performance Analytics</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>Real-time evaluation data and lecturer performance</p>
        </div>
        <button onClick={fetchAnalytics} style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Refresh Data</button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {[
          { label: 'Total Submissions', val: stats.totalEvaluations, bg: '#800020' },
          { label: 'Total Lecturers', val: stats.totalLecturers, bg: '#800020' },
          { label: 'Total Courses', val: stats.totalCourses, bg: '#9a1a3a' },
          { label: 'Overall Average', val: stats.overallAverage || '—', bg: '#5d0018' }
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(128,0,32,0.1)' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: '0 0 6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', margin: 0 }}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Lecturer Performance Metrics</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>Showing {filteredLecturers.length} active lecturers</p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search lecturer name..."
                value={searchLecturer}
                onChange={(e) => { setSearchLecturer(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                style={{ padding: '10px 12px 10px 40px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', width: '280px', fontWeight: 500 }}
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', marginTop: '8px', zIndex: 50, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {suggestions.map(s => (
                  <div key={s.id} onClick={() => { setSearchLecturer(s.name); setShowSuggestions(false); }} onMouseEnter={(e) => e.currentTarget.style.background = '#fdf2f2'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{s.title || 'Lecturer'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }} onClick={() => setShowSuggestions(false)}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Lecturer Profile', 'Submissions', 'Avg Rating', 'Performance Bar', ''].map(h => (
                <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLecturers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '64px', textAlign: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>No results found for "{searchLecturer}"</p>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>Total of {lecturerRatings.length} lecturers recorded.</p>
                </td>
              </tr>
            ) : filteredLecturers.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="hover:bg-slate-50">
                <td style={{ padding: '16px 24px' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#fdf2f2] text-[#800020] flex items-center justify-center font-black text-sm">{l.name.charAt(0)}</div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{l.name}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, fontWeight: 600 }}>{l.title || 'Lecturer'}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}><span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>{l.total} evaluations</span></td>
                <td style={{ padding: '16px 24px' }}>
                  <div className="flex items-center gap-2">
                    <Star size={16} color="#800020" fill={l.average > 0 ? "#800020" : "none"} />
                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{l.average || '—'}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ width: '120px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(l.average / 5) * 100}%`, height: '100%', background: l.average >= 4 ? '#16a34a' : l.average >= 3 ? '#800020' : '#dc2626' }} />
                  </div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <button onClick={() => navigate('/qa/responses')} style={{ padding: '8px 16px', background: '#fdf2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#800020', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
