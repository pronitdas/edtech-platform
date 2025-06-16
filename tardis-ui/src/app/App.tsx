// App.tsx
import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Edtech from './page'
import LoginPage from './LoginPage'
import SignUpPage from './SignUp'
import LandingPage from './landing/page'
import PricingPage from './pricing/page'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/pricing' element={<PricingPage />} />
        <Route path='/signup' element={<SignUpPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/dashboard' element={<Edtech />} />
      </Routes>
    </Router>
  )
}

export default App
