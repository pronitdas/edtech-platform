// App.tsx
import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import ModernPage from './ModernPage'
import LoginPage from './LoginPage'
import SignUpPage from './SignUp'
import LandingPage from './landing/page'
import PricingPage from './pricing/page'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/pricing' element={<PricingPage />} />
        <Route path='/signup' element={<SignUpPage />} />
        <Route path='/onboarding' element={<OnboardingFlow />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/dashboard' element={<ModernPage />} />
      </Routes>
    </Router>
  )
}

export default App
