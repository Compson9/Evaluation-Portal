import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import QALogin from './pages/QA/Login'
import QADashboard from './pages/QA/Dashboard'
import DashboardHome from './pages/QA/DashboardHome'
import Forms from './pages/QA/Forms'
import Courses from './pages/QA/Courses'
import Lecturers from './pages/QA/Lecturers'
import Departments from './pages/QA/Departments'
import Analytics from './pages/QA/Analytics'
import StudentEvaluation from './pages/Student/Evaluation'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<StudentEvaluation />} />
          <Route path="/qa/login" element={<QALogin />} />

          {/* Protected QA Routes */}
          <Route
            path="/qa"
            element={
              <ProtectedRoute>
                <QADashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/qa/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="forms" element={<Forms />} />
            <Route path="courses" element={<Courses />} />
            <Route path="lecturers" element={<Lecturers />} />
            <Route path="departments" element={<Departments />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App