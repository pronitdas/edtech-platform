import React from 'react'
import ReactDOM from 'react-dom/client' // Use 'react-dom/client' for React 18+
import App from '../App' // This is the main App.tsx with UserProvider
import './globals.css'

// Create a root using React 18's createRoot
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
