// SignUpPage.tsx
import supabase from '@/services/supabase'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Please provide both email and password.')
      setLoading(false)
      return
    }

    try {
      const { user, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (user) {
        navigate('/login') // Redirect to login page after successful sign up
      }
    } catch (err) {
      setError('An error occurred during sign up.')
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100'>
      <div className='w-full max-w-md rounded-lg bg-white p-8 shadow-lg'>
        <h2 className='mb-6 text-center text-2xl font-semibold text-gray-700'>
          Sign Up
        </h2>

        <form onSubmit={handleSignUp}>
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
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className='mt-4 text-center text-sm text-gray-600'>
          Already have an account?{' '}
          <a href='/login' className='text-blue-600 hover:text-blue-800'>
            Log In
          </a>
        </p>
      </div>
    </div>
  )
}

export default SignUpPage
