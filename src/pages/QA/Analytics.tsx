import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts'
import { 
  BarChart3, TrendingUp, Users, FileText, Download, Search, 
  ExternalLink, Star, X, AlertCircle, PieChart as PieIcon, Activity 
} from 'lucide-react'
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

interface DistributionData {
  name: string
  value: number
  color: string
}

interface Stats {
  totalEvaluations: number
  totalLecturers: number
  totalCourses: number
  overallAverage: number
}

const RATING_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981']

export default function Analytics() {
  const [stats, setStats] = useState<Stats>({
    totalEvaluations: 0,
    totalLecturers: 0,
    totalCourses: 0,
    overallAverage: 0
  })
  const [lecturerRatings, setLecturerRatings] = useState<LecturerRating[]>([])
  const [sectionRatings, setSectionRatings] = useState<SectionRating[]>([])
  const [distribution, setDistribution] = useState<DistributionData[]>([])
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

      const { data: allResponses } = await supabase
        .from('student_responses')
        .select('id, course_assignments(lecturer_id)')

      const { data: allAnswers } = await supabase
        .from('response_answers')
        .select(`
          rating_value,
          response_id,
          form_questions(section),
          student_responses(course_assignments(lecturer_id))
        `)
        .not('rating_value', 'is', null)

      const { data: textAnswers } = await supabase
        .from('response_answers')
        .select('text_value')
        .not('text_value', 'is', null)
        .limit(10)

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

      // 1. Section Ratings
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

      // 2. Rating Distribution (Pie Chart)
      const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ratings.forEach((a: any) => {
        if (a.rating_value) distMap[a.rating_value]++
      })
      setDistribution([
        { name: '1 - Poor', value: distMap[1], color: '#ef4444' },
        { name: '2 - Satisfactory', value: distMap[2], color: '#f97316' },
        { name: '3 - Good', value: distMap[3], color: '#f59e0b' },
        { name: '4 - Very Good', value: distMap[4], color: '#84cc16' },
        { name: '5 - Excellent', value: distMap[5], color: '#10b981' }
      ])

      // 3. Lecturer Ratings
      const evalCountMap: Record<string, number> = {}
      ;(allResponses || []).forEach((r: any) => {
        const lid = r.course_assignments?.lecturer_id
        if (lid) evalCountMap[lid] = (evalCountMap[lid] || 0) + 1
      })

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
          total: evalCountMap[l.id] || 0
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
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid #800020', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Analytics Insights</h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>Visualize lecturer performance and student feedback</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAnalytics} style={{ padding: '10px 20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: '#475569', cursor: 'pointer' }}>
            Refresh Data
          </button>
          <button style={{ padding: '10px 20px', background: '#800020', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626', fontSize: '14px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {[
          { label: 'Submissions', val: stats.totalEvaluations, icon: FileText, color: '#800020' },
          { label: 'Lecturers', val: stats.totalLecturers, icon: Users, color: '#9a1a3a' },
          { label: 'Courses', val: stats.totalCourses, icon: BarChart3, color: '#5d0018' },
          { label: 'Avg Score', val: stats.overallAverage || '—', icon: Star, color: '#4a0012' }
        ].map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} style={{ 
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px', fontWeight: 500 }}>{c.label}</p>
                  <p style={{ fontSize: '28px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{c.val}</p>
                </div>
                <div style={{ padding: '10px', background: '#fdf2f2', borderRadius: '12px' }}>
                  <Icon size={20} color="#800020" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        
        {/* Section Performance (Bar Chart) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            <div className="flex items-center gap-2">
              <Activity size={18} color="#800020" />
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Performance by Section</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectionRatings} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 5]} hide />
              <YAxis dataKey="section" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={120} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="average" fill="#800020" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution (Pie Chart) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '24px' }}>
            <PieIcon size={18} color="#800020" />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Score Distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribution}
                cx="50%" cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Main Table Section */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Lecturer Performance Metrics</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Analyze rankings based on student evaluations</p>
          </div>
          <div className="relative">
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Filter by name..."
              value={searchLecturer}
              onChange={(e) => setSearchLecturer(e.target.value)}
              style={{ padding: '12px 16px 12px 42px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', width: '280px', background: '#f8fafc' }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Lecturer', 'Status', 'Score', 'Rating Progress', ''].map(h => (
                <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLecturers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>No records found matching your filter.</td></tr>
            ) : filteredLecturers.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#fdf2f2] text-[#800020] flex items-center justify-center font-semibold text-sm">{l.name.charAt(0)}</div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{l.name}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{l.title || 'Faculty'}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ 
                    fontSize: '12px', fontWeight: 500, padding: '4px 12px', borderRadius: '20px', 
                    background: l.total > 0 ? '#f0fdf4' : '#f8fafc', color: l.total > 0 ? '#16a34a' : '#64748b' 
                  }}>
                    {l.total} Evaluations
                  </span>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div className="flex items-center gap-2">
                    <Star size={16} color="#800020" fill={l.average > 0 ? "#800020" : "none"} />
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{l.average || '—'}</span>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ width: '140px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(l.average / 5) * 100}%`, height: '100%', background: l.average >= 4 ? '#16a34a' : l.average >= 3 ? '#800020' : '#dc2626' }} />
                  </div>
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  <button onClick={() => navigate('/qa/responses')} style={{ padding: '8px 16px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#800020', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
