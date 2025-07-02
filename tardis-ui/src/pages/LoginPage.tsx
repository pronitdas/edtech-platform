import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  // Get the redirect path from location state, default to /app
  const from = location.state?.from?.pathname || '/app'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError('')

    try {
      // Call the demo login endpoint directly
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/v2/auth/demo-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Demo login failed')
      }

      const data = await response.json()

      // Store the token and user data
      localStorage.setItem('auth_token', data.access_token)

      // Navigate to the app
      navigate(from, { replace: true })

      // Reload to update auth state
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Sign in to your account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Or{' '}
            <Link
              to='/register'
              className='font-medium text-indigo-600 hover:text-indigo-500'
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700'>
              {error}
            </div>
          )}
          <div className='-space-y-px rounded-md shadow-sm'>
            <div>
              <label htmlFor='email' className='sr-only'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                className='relative block w-full rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                placeholder='Email address'
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor='password' className='sr-only'>
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
                className='relative block w-full rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                placeholder='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <Link
              to='/forgot-password'
              className='text-sm text-indigo-600 hover:text-indigo-500'
            >
              Forgot your password?
            </Link>
          </div>

          <div className='space-y-3'>
            <button
              type='submit'
              disabled={loading}
              className='group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50'
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='bg-gray-50 px-2 text-gray-500'>Or</span>
              </div>
            </div>

            <button
              type='button'
              onClick={handleDemoLogin}
              disabled={loading}
              className='group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50'
            >
              {loading ? 'Signing in...' : 'Try Demo User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
