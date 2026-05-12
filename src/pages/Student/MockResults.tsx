import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, GraduationCap, Download, ArrowLeft } from 'lucide-react'
import logo from '../../assets/logo.png'

export default function MockResults() {
  const [student, setStudent] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const session = localStorage.getItem('student_session')
    if (!session) {
      navigate('/')
      return
    }
    setStudent(JSON.parse(session))
  }, [navigate])

  function handleLogout() {
    localStorage.removeItem('student_session')
    navigate('/')
  }

  if (!student) return null

  // Generate fake mock grades based on student id
  const fakeGrades = [
    { code: 'CS122', title: 'Introduction to Computing', credits: 3, grade: 'A', score: 85 },
    { code: 'MTH101', title: 'Calculus I', credits: 3, grade: 'B+', score: 78 },
    { code: 'PHY105', title: 'General Physics', credits: 4, grade: 'A-', score: 82 },
    { code: 'ENG101', title: 'Academic Writing', credits: 2, grade: 'A', score: 90 },
    { code: 'UGRC150', title: 'Critical Thinking', credits: 3, grade: 'B', score: 74 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: '#ffffff', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px' }}>
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#800020', margin: 0 }}>
            Exams Portal
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
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <CheckCircle2 size={24} color="#059669" className="flex-shrink-0" />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#065f46', margin: '0 0 4px' }}>Evaluations Complete</h3>
            <p style={{ fontSize: '14px', color: '#047857', margin: 0 }}>
              Thank you! You have successfully completed all required course and lecturer evaluations. Your results are now available.
            </p>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          {/* Transcript Header */}
          <div style={{ padding: '32px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fdf2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <GraduationCap size={32} color="#800020" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Semester Results Statement</h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>First Semester, 2025/2026 Academic Year</p>
          </div>

          {/* Student Details Box */}
          <div style={{ padding: '24px 32px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Name</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{student.full_name}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Index Number</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{student.index_number}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Programme/Department</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{student.departments?.name || 'Computer Science'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</p>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{student.level}</p>
            </div>
          </div>

          {/* Grades Table */}
          <div style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Course Code</th>
                  <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Course Title</th>
                  <th style={{ padding: '16px 32px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Credits</th>
                  <th style={{ padding: '16px 32px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {fakeGrades.map((g, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px 32px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{g.code}</td>
                    <td style={{ padding: '16px 32px', fontSize: '14px', color: '#334155' }}>{g.title}</td>
                    <td style={{ padding: '16px 32px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>{g.credits}</td>
                    <td style={{ padding: '16px 32px', textAlign: 'center', fontSize: '15px', fontWeight: 700, color: g.grade.startsWith('A') ? '#059669' : '#0f172a' }}>{g.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: '24px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GPA</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#800020', margin: 0 }}>3.65</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CGPA</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#800020', margin: 0 }}>3.58</p>
              </div>
            </div>
            
            <button style={{ padding: '10px 20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
