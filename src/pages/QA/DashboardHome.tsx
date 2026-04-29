import { useEffect, useState } from 'react'
import { FileText, BookOpen, Users, Star, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface Stats {
  totalEvaluations: number
  totalCourses: number
  totalLecturers: number
  averageRating: number
}

interface Lecturer {
  id: string
  full_name: string
  title: string | null
  department_id: string
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>({
    totalEvaluations: 0,
    totalCourses: 0,
    totalLecturers: 0,
    averageRating: 0
  })
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          { count: evaluations },
          { count: courses },
          { count: lecturerCount },
          { data: ratings },
          { data: lecturerList }
        ] = await Promise.all([
          supabase.from('student_responses').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('lecturers').select('*', { count: 'exact', head: true }),
          supabase.from('response_answers').select('rating_value').not('rating_value', 'is', null),
          supabase.from('lecturers').select('*').limit(3)
        ])

        const avg = ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + (r.rating_value || 0), 0) / ratings.length
          : 0

        setStats({
          totalEvaluations: evaluations || 0,
          totalCourses: courses || 0,
          totalLecturers: lecturerCount || 0,
          averageRating: parseFloat(avg.toFixed(1))
        })

        setLecturers(lecturerList || [])
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  

  const statCards = [
    {
      title: 'Total Evaluations',
      value: stats.totalEvaluations,
      icon: FileText,
      color: '#ffffff',
      bg: '#1d4ed8',        // Royal Blue
      border: '#1d4ed8'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: '#ffffff',
      bg: '#0369a1',        // Deep Sky Blue
      border: '#0369a1'
    },
    {
      title: 'Total Lecturers',
      value: stats.totalLecturers,
      icon: Users,
      color: '#ffffff',
      bg: '#1240ab',        // Vibrant Royal
      border: '#1240ab'
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: '#ffffff',
      bg: '#2563eb',        // Bright Blue
      border: '#2563eb'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '300px' }}>
        <div
          className="rounded-full"
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #1d4ed8',
            animation: 'spin 0.8s linear infinite'
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
          {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0' }}>
          Here's an overview of your evaluation system.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              style={{
                background: '#ffffff',
                border: '0.5px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#bfdbfe'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '34px',
                  height: '34px',
                  background: card.bg,
                  marginBottom: '10px'
                }}
              >
                <Icon size={16} color={card.color} />
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 2px' }}>
                {card.title}
              </p>
              <p style={{ fontSize: '24px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Two Column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Recent Evaluations */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
              Recent Evaluations
            </p>
            <button
              style={{ fontSize: '11px', color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all
            </button>
          </div>

          {stats.totalEvaluations === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                className="flex items-center justify-center rounded-lg mx-auto"
                style={{ width: '36px', height: '36px', background: '#eff6ff', marginBottom: '8px' }}
              >
                <FileText size={16} color="#1d4ed8" />
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px' }}>
                No evaluations yet
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                Evaluations will appear here once students submit
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#64748b' }}>Evaluations loaded</p>
          )}
        </div>

        {/* Top Lecturers */}
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
              Lecturers
            </p>
            <button
              onClick={() => navigate('/qa/lecturers')}
              style={{ fontSize: '11px', color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {lecturers.map((lecturer, i) => (
              <div
                key={lecturer.id}
                className="flex items-center gap-3"
                style={{
                  padding: '8px 0',
                  borderBottom: i < lecturers.length - 1 ? '0.5px solid #f1f5f9' : 'none'
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: '30px',
                    height: '30px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 500
                  }}
                >
                  {lecturer.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="truncate"
                    style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', margin: 0 }}
                  >
                    {lecturer.full_name}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    {lecturer.title || 'Lecturer'}
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 rounded-md"
                  style={{
                    background: '#fefce8',
                    border: '0.5px solid #fef08a',
                    padding: '3px 7px'
                  }}
                >
                  <Star size={10} color="#eab308" fill="#eab308" />
                  <span style={{ fontSize: '11px', color: '#854d0e', fontWeight: 500 }}>—</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div
        className="flex items-center justify-between rounded-xl"
        style={{
          background: '#1d4ed8',
          padding: '16px 20px'
        }}
      >
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', margin: '0 0 2px' }}>
            Ready to collect evaluations?
          </p>
          <p style={{ fontSize: '12px', color: '#bfdbfe', margin: 0 }}>
            Create your first form and share it with students.
          </p>
        </div>
        <button
          onClick={() => navigate('/qa/forms')}
          className="flex items-center gap-2 rounded-lg flex-shrink-0"
          style={{
            background: '#ffffff',
            color: '#1d4ed8',
            fontSize: '12px',
            fontWeight: 500,
            padding: '8px 16px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Create Form
          <ArrowRight size={13} />
        </button>
      </div>

    </div>
  )
}