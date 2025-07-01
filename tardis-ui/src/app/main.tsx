import React from 'react'
import ReactDOM from 'react-dom/client' // Use 'react-dom/client' for React 18+
import App from './App'
import './globals.css'
import { UserProvider } from '@/contexts/UserContext'

// Create a root using React 18's createRoot
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    {/* Wrap the app with the UserProvider context */}
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
)
