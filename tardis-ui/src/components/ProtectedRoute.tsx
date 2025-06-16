import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useUser()
  const location = useLocation()

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  return <>{children}</>
}
