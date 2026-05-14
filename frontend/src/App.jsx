import { Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import Company from './pages/Company'
import SubmitReview from './pages/SubmitReview'
import InterviewPrep from './pages/InterviewPrep'
import Opportunities from './pages/Opportunities'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import About from './pages/About'
import ProtectedRoute from './components/ProtectedRoute'
import CookieBanner from './components/CookieBanner'

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
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/search" element={<Search />} />
        <Route path="/company/:id" element={<Company />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/submit-review" element={<ProtectedRoute><SubmitReview /></ProtectedRoute>} />
        <Route path="/interview-prep/:id" element={<ProtectedRoute><InterviewPrep /></ProtectedRoute>} />
        <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
      <CookieBanner />
      <Analytics />
    </>
  )
}

export default App
