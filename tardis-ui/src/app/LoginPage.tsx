// LoginPage.tsx
import { useUser } from '@/contexts/UserContext'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false) // Added loading state
  const navigate = useNavigate() // Initialize useNavigate hook
  const { user, login } = useUser()
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Please provide both email and password.')
      setLoading(false)
      return
    }

    try {
      await login(email, password)
      setLoading(false)
      // Redirect to dashboard on successful login
      navigate('/dashboard') // Adjust the route as per your need
    } catch (error: any) {
      setLoading(false)
      console.log(error.message)
      setError(error.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
        <h2 className='mb-6 text-center text-2xl font-semibold text-gray-700'>
          Login
        </h2>

        <form onSubmit={handleLogin}>
          <div className='mb-4'>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-600'
            >
              Email
            </label>
            <input
              type='email'
              id='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='mt-2 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>

          <div className='mb-6'>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-600'
            >
              Password
            </label>
            <input
              type='password'
              id='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='mt-2 w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>

          {error && <p className='mb-4 text-sm text-red-500'>{error}</p>}

          <button
            type='submit'
            className='w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={loading} // Disable button while loading
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className='mt-4 text-center text-sm text-gray-600'>
          Don't have an account?{' '}
          <a href='/signup' className='text-blue-600 hover:text-blue-800'>
            Sign Up
          </a>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
