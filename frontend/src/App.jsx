import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Company from './pages/Company'
import SubmitReview from './pages/SubmitReview'
import ResumeFit from './pages/ResumeFit'
import InterviewPrep from './pages/InterviewPrep'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-lantern-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/company/:id" element={<ProtectedRoute><Company /></ProtectedRoute>} />
      <Route path="/submit-review" element={<ProtectedRoute><SubmitReview /></ProtectedRoute>} />
      <Route path="/resume-fit" element={<ProtectedRoute><ResumeFit /></ProtectedRoute>} />
      <Route path="/interview-prep/:id" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
