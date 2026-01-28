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
import GeneralAnalyticsPage from './pages/GeneralAnalyticsPage'
import ChapterViewer from './components/ChapterViewer'
import ModernPage from './app/ModernPage'
import TeacherDashboard from './components/dashboards/TeacherDashboard'
import ContentCreatorDashboard from './components/dashboards/ContentCreatorDashboard'
import EnhancedOnboarding from './components/onboarding/EnhancedOnboarding'
import { UnifiedPracticeModule } from './components/practice'
import { analyticsService } from './services/analytics-service'
import { useUser } from './contexts/UserContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ApiTestPage from './pages/ApiTestPage'

function AppContent() {
  const { user } = useUser()
  const { apiClient } = useAuth()
  return (
    <InteractionTrackerProvider
      dataService={analyticsService}
      apiClient={apiClient}
      userId={user?.id ? String(user.id) : ''}
    >
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path='/' element={<LandingPage />} />
            <Route path='/pricing' element={<PricingPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/signup' element={<RegisterPage />} />
            
            {/* API Testing - accessible without authentication for development */}
            <Route path='/api-test' element={<ApiTestPage />} />

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
              path='/dashboard'
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
              path='/analytics/general'
              element={
                <ProtectedRoute>
                  <GeneralAnalyticsPage />
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
              path='/practice'
              element={
                <ProtectedRoute>
                  <UnifiedPracticeModule />
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
              path='/creator'
              element={
                <ProtectedRoute>
                  <ContentCreatorDashboard />
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
              path='/enhanced-onboarding'
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
  )
}

function App() {
  return (
    <UserProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </UserProvider>
  )
}

export default App

