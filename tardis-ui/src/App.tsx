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
import MainApplication from './app/page'
import { analyticsService } from './services/analytics-service'
import { useUser } from './contexts/UserContext'

function App() {
  const { user } = useUser()
  return (
    <UserProvider>
      <InteractionTrackerProvider
        dataService={analyticsService}
        userId={user?.id || ''}
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
                  <MainApplication />
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

            {/* ...existing routes... */}
          </Routes>
        </Router>
      </InteractionTrackerProvider>
    </UserProvider>
  )
}

export default App
