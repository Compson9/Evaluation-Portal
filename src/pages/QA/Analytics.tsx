import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Users, FileText, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface LecturerRating {
  name: string
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

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
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

      // Placeholder lecturer ratings (will be real when responses exist)
      const lecturerData = (lecturers || []).map(l => ({
        name: l.full_name.split(' ').slice(0, 2).join(' '),
        average: 0,
        total: 0
      }))
      setLecturerRatings(lecturerData)

      // Comments
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
    {
      title: 'Total Evaluations',
      value: stats.totalEvaluations,
      icon: FileText,
      color: '#ffffff',
      bg: '#800020'
    },
    {
      title: 'Total Lecturers',
      value: stats.totalLecturers,
      icon: Users,
      color: '#ffffff',
      bg: '#800020'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BarChart3,
      color: '#ffffff',
      bg: '#0369a1'
    },
    {
      title: 'Overall Average',
      value: stats.overallAverage || '—',
      icon: TrendingUp,
      color: '#ffffff',
      bg: '#9a1a3a'
    }
  ]

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
            Analytics
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
            Evaluation performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#ffffff',
              border: '0.5px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#0f172a',
              outline: 'none'
            }}
          >
            <option value="All">All Semesters</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
          <button
            className="flex items-center gap-2"
            style={{
              padding: '8px 14px',
              background: '#800020',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              style={{
                background: card.bg,
                borderRadius: '12px',
                padding: '18px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(18,64,171,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                position: 'absolute', top: '-16px', right: '-16px',
                width: '70px', height: '70px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)'
              }} />
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '34px', height: '34px',
                  background: 'rgba(255,255,255,0.2)',
                  marginBottom: '12px'
                }}
              >
                <Icon size={16} color="#ffffff" />
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.title}
              </p>
              <p style={{ fontSize: '26px', fontWeight: 500, color: '#ffffff', margin: 0 }}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Section Ratings Chart */}
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: '0 0 16px' }}>
            Ratings by Section
          </p>

          {sectionRatings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div
                className="flex items-center justify-center rounded-lg mx-auto"
                style={{ width: '40px', height: '40px', background: '#fdf2f2', marginBottom: '10px' }}
              >
                <BarChart3 size={18} color="#800020" />
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                No data yet. Charts will appear once students submit evaluations.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sectionRatings} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="section"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '0.5px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="average" fill="#800020" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Lecturer Ratings */}
        <div style={{
          background: '#ffffff',
          border: '0.5px solid #e2e8f0',
          borderRadius: '10px',
          padding: '16px'
        }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: '0 0 16px' }}>
            Lecturer Performance
          </p>

          {lecturerRatings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                No lecturer data available yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lecturerRatings.map((lecturer, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                      {lecturer.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#800020', fontWeight: 500, margin: 0 }}>
                      {lecturer.average > 0 ? `${lecturer.average}/5` : '—'}
                    </p>
                  </div>
                  <div style={{
                    height: '6px',
                    background: '#f1f5f9',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${lecturer.average > 0 ? (lecturer.average / 5) * 100 : 0}%`,
                      background: '#800020',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Comments */}
      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e2e8f0',
        borderRadius: '10px',
        padding: '16px'
      }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: '0 0 14px' }}>
          Student Comments
        </p>

        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              No comments yet. Comments will appear once students submit evaluations.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {comments.map((comment, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  background: '#f8faff',
                  border: '0.5px solid #e2e8f0',
                  borderLeft: '3px solid #800020',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '13px',
                  color: '#374151'
                }}
              >
                {comment}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating Scale Guide */}
      <div style={{
        background: '#fdf2f2',
        border: '0.5px solid #fecaca',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <p style={{ fontSize: '12px', fontWeight: 500, color: '#800020', margin: 0 }}>
          Rating Scale:
        </p>
        {[
          ['5', 'Excellent'],
          ['4', 'Very Good'],
          ['3', 'Good'],
          ['2', 'Satisfactory'],
          ['1', 'Poor']
        ].map(([num, label]) => (
          <div key={num} className="flex items-center gap-2">
            <span style={{
              width: '22px', height: '22px',
              background: '#800020',
              color: '#ffffff',
              borderRadius: '50%',
              fontSize: '11px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {num}
            </span>
            <span style={{ fontSize: '12px', color: '#800020' }}>{label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
