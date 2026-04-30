import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Users, FileText, Download, Search, ExternalLink, Star, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface LecturerRating {
  id: string
  name: string
  title: string | null
  average: number
  total: number
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
  const [semester, setSemester] = useState('All')
  
  // Search
  const [searchLecturer, setSearchLecturer] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const [
        { count: evaluations },
        { count: lecturerCount },
        { count: courseCount },
        { data: answers },
        { data: textAnswers },
        { data: lecturers }
      ] = await Promise.all([
        supabase.from('student_responses').select('*', { count: 'exact', head: true }),
        supabase.from('lecturers').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('response_answers').select('rating_value, question_id, form_questions(section)').not('rating_value', 'is', null),
        supabase.from('response_answers').select('text_value').not('text_value', 'is', null).limit(10),
        supabase.from('lecturers').select('id, full_name, title')
      ])

      const allRatings = answers || []
      const overall = allRatings.length > 0
        ? allRatings.reduce((sum, a) => sum + (a.rating_value || 0), 0) / allRatings.length
        : 0

      setStats({
        totalEvaluations: evaluations || 0,
        totalLecturers: lecturerCount || 0,
        totalCourses: courseCount || 0,
        overallAverage: parseFloat(overall.toFixed(1))
      })

      // Section ratings
      const sectionMap: Record<string, number[]> = {}
      allRatings.forEach((a: any) => {
        const section = a.form_questions?.section || 'Unknown'
        if (!sectionMap[section]) sectionMap[section] = []
        sectionMap[section].push(a.rating_value)
      })

      const sectionData = Object.entries(sectionMap).map(([section, ratings]) => ({
        section: section.length > 15 ? section.substring(0, 15) + '...' : section,
        average: parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
      }))

      setSectionRatings(sectionData)

      // Lecturer ratings
      const { data: respData } = await supabase
        .from('response_answers')
        .select(`
          rating_value,
          student_responses(
            course_assignments(
              lecturer_id
            )
          )
        `)
        .not('rating_value', 'is', null)

      const lectMap: Record<string, number[]> = {}
      (respData as any || []).forEach((r: any) => {
        const lid = r.student_responses?.course_assignments?.lecturer_id
        if (lid) {
          if (!lectMap[lid]) lectMap[lid] = []
          lectMap[lid].push(r.rating_value)
        }
      })

      const lecturerData = (lecturers || []).map(l => {
        const ratings = lectMap[l.id] || []
        return {
          id: l.id,
          name: l.full_name || 'Unknown',
          title: l.title,
          average: ratings.length > 0 ? parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 0,
          total: ratings.length
        }
      }).sort((a, b) => b.average - a.average)
      
      setLecturerRatings(lecturerData)

      const commentList = (textAnswers || [])
        .map(a => a.text_value)
        .filter(Boolean) as string[]
      setComments(commentList)

    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
    setLoading(false)
  }

  const statCards = [
    { title: 'Total Evaluations', value: stats.totalEvaluations, icon: FileText, bg: '#800020' },
    { title: 'Total Lecturers', value: stats.totalLecturers, icon: Users, bg: '#800020' },
    { title: 'Total Courses', value: stats.totalCourses, icon: BarChart3, bg: '#9a1a3a' },
    { title: 'Overall Average', value: stats.overallAverage || '—', icon: TrendingUp, bg: '#5d0018' }
  ]

  // Filter table immediately by searchLecturer
  const filteredLecturers = lecturerRatings.filter(l => 
    (l.name || '').toLowerCase().includes(searchLecturer.toLowerCase())
  )

  // Show suggestions only if search term is long enough
  const suggestions = lecturerRatings
    .filter(l => searchLecturer.length >= 2 && l.name.toLowerCase().includes(searchLecturer.toLowerCase()))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '300px' }}>
        <div style={{
          width: '28px', height: '28px',
          border: '2px solid #e2e8f0',
          borderTop: '2px solid #800020',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Performance Analytics
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Comprehensive overview of teaching and course evaluations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            style={{
              padding: '8px 16px', background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer'
            }}
          >
            Refresh Data
          </button>
          <button
            style={{
              padding: '8px 16px', background: '#800020', border: 'none',
              borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#ffffff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2'
            }}
          >
            <Download size={14} style={{ marginRight: '6px' }} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              style={{
                background: card.bg, borderRadius: '16px', padding: '24px',
                position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                position: 'absolute', top: '-10px', right: '-10px',
                width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
              }} />
              <div
                className="flex items-center justify-center"
                style={{
                  width: '40px', height: '40px', background: 'rgba(255,255,255,0.15)',
                  marginBottom: '16px', borderRadius: '12px'
                }}
              >
                <Icon size={20} color="#ffffff" />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.title}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Ratings by Section</p>
          </div>
          {sectionRatings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><p style={{ fontSize: '13px', color: '#94a3b8' }}>No data available.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sectionRatings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="section" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#fdf2f2' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="average" fill="#800020" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Recent Student Feedback</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>No comments yet.</p>
            ) : (
              comments.map((comment, i) => (
                <div key={i} style={{ padding: '12px', background: '#f8fafc', borderLeft: '3px solid #800020', borderRadius: '0 8px 8px 0', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                  "{comment}"
                </div>
              ))
            )}
          </div>
          <button onClick={() => navigate('/qa/responses')} style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#800020', cursor: 'pointer' }}>View All</button>
        </div>
      </div>

      {/* Lecturer Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Lecturer Performance</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Detailed scores and response counts</p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search lecturer..."
                value={searchLecturer}
                onChange={(e) => {
                  setSearchLecturer(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                style={{ padding: '8px 12px 8px 32px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', width: '240px' }}
              />
              {searchLecturer && (
                <button onClick={() => { setSearchLecturer(''); setShowSuggestions(false); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={12} color="#94a3b8" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, 
                background: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: '8px', marginTop: '4px', zIndex: 50,
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', overflow: 'hidden'
              }}>
                {suggestions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => { setSearchLecturer(s.name); setShowSuggestions(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fdf2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                  >
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{s.name}</p>
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
              {['Lecturer', 'Evaluations', 'Rating', 'Performance', ''].map(h => (
                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLecturers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No lecturers found matching your search.</td></tr>
            ) : filteredLecturers.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fdf2f2] text-[#800020] flex items-center justify-center font-bold text-xs">{l.name.charAt(0)}</div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{l.name}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{l.title || 'Lecturer'}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', color: '#475569' }}>{l.total} reviews</span></td>
                <td style={{ padding: '16px 20px' }}>
                  <div className="flex items-center gap-1">
                    <Star size={14} color="#800020" fill={l.average > 0 ? "#800020" : "none"} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{l.average || '—'}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(l.average / 5) * 100}%`, height: '100%', background: l.average >= 4 ? '#16a34a' : l.average >= 3 ? '#800020' : '#dc2626' }} />
                  </div>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button onClick={() => navigate('/qa/responses')} style={{ background: 'none', border: 'none', color: '#800020', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>View<ExternalLink size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
