import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import QALogin from './pages/QA/Login'
import QADashboard from './pages/QA/Dashboard'
import DashboardHome from './pages/QA/DashboardHome'
import Forms from './pages/QA/Forms'
import Courses from './pages/QA/Courses'
import Lecturers from './pages/QA/Lecturers'
import Students from './pages/QA/Students'
import Departments from './pages/QA/Departments'
import Analytics from './pages/QA/Analytics'
import PortalLogin from './pages/Student/PortalLogin'
import PendingEvaluations from './pages/Student/PendingEvaluations'
import StudentEvaluation from './pages/Student/Evaluation'
import MockResults from './pages/Student/MockResults'
import Responses from './pages/QA/Responses'


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PortalLogin />} />
          <Route path="/pending" element={<PendingEvaluations />} />
          <Route path="/evaluate/:assignmentId" element={<StudentEvaluation />} />
          <Route path="/results" element={<MockResults />} />
          <Route path="/qa/login" element={<QALogin />} />
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
            <Route path="students" element={<Students />} />
            <Route path="departments" element={<Departments />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="responses" element={<Responses />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App