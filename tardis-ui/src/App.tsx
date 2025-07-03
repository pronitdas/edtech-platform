import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import { InteractionTrackerProvider } from './contexts/InteractionTrackerContext'

// Account pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'

// Protected route wrapper
import ProtectedRoute from './components/ProtectedRoute'

// Main application components
import LandingPage from './app/landing/page'
import PricingPage from './app/pricing/page'
import AnalyticsPage from './pages/AnalyticsPage'
import ChapterViewer from './components/ChapterViewer'
import ModernPage from './app/ModernPage'
import TeacherDashboard from './components/TeacherDashboard/TeacherDashboard'
import EnhancedOnboarding from './components/onboarding/EnhancedOnboarding'
import { analyticsService } from './services/analytics-service'
import { useUser } from './contexts/UserContext'

function App() {
  const { user } = useUser()
  return (
    <UserProvider>
      <InteractionTrackerProvider
        dataService={analyticsService}
        userId={user?.id ? String(user.id) : ''}
      >
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path='/' element={<LandingPage />} />
            <Route path='/pricing' element={<PricingPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path='/app'
              element={
                <ProtectedRoute>
                  <ModernPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/profile'
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/analytics/:knowledgeId'
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/chapter/:knowledgeId/:chapterId'
              element={
                <ProtectedRoute>
                  <ChapterViewer />
                </ProtectedRoute>
              }
            />
            <Route
              path='/teacher'
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path='/onboarding'
              element={
                <ProtectedRoute>
                  <EnhancedOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path='/shared-content/:contentId'
              element={
                <ProtectedRoute>
                  <ModernPage />
                </ProtectedRoute>
              }
            />

            {/* ...existing routes... */}
          </Routes>
        </Router>
      </InteractionTrackerProvider>
    </UserProvider>
  )
}

export default App
