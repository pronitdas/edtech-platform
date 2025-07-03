// LoginPage.tsx
import { useUser } from '@/contexts/UserContext'
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { user, login } = useUser()

  useEffect(() => {
    setIsVisible(true)
  }, [])

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
      navigate('/dashboard')
    } catch (error: any) {
      setLoading(false)
      console.log(error.message)
      setError(error.message || 'Login failed. Please try again.')
    }
  }

  const handleDemoLogin = async (userType: 'student' | 'teacher' = 'student') => {
    setLoading(true)
    setError('')

    try {
      // Call the appropriate demo login endpoint
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const endpoint = userType === 'teacher' ? '/v2/auth/demo-teacher-login' : '/v2/auth/demo-login'
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Demo ${userType} login failed`)
      }

      const data = await response.json()

      // Store the token and user data
      localStorage.setItem('auth_token', data.access_token)

      // Use window.location.href for a full page navigation
      window.location.href = '/dashboard'
    } catch (error: any) {
      setLoading(false)
      console.log(error.message)
      setError(error.message || `Demo ${userType} login failed. Please try again.`)
    }
  }

  return (
    <div className='min-h-screen relative overflow-x-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600'>
      {/* Dotted pattern background */}
      <div className='absolute inset-0 opacity-20' style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>

      {/* Navigation */}
      <nav className='relative z-50 w-full py-4'>
        <div className='container mx-auto px-6'>
          <div className='flex items-center justify-between'>
            <Link to='/' className='flex items-center space-x-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20'>
                <BookOpen className='h-6 w-6 text-white' />
              </div>
              <span className='text-2xl font-bold text-white'>TARDIS</span>
            </Link>

            <div className='flex items-center space-x-4'>
              <Link
                to='/signup'
                className='text-white/80 hover:text-white transition-colors duration-200'
              >
                Need an account?
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className='flex min-h-[calc(100vh-120px)] items-center justify-center px-6'>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20, scale: isVisible ? 1 : 0.95 }}
          transition={{ duration: 0.6 }}
          className='w-full max-w-md'
        >
          <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20'>
            {/* Header */}
            <div className='text-center mb-8'>
              <h1 className='text-3xl font-bold text-gray-800 mb-2'>Welcome Back</h1>
              <p className='text-gray-600'>Continue your AI-powered learning journey</p>
            </div>

            <form onSubmit={handleLogin} className='space-y-6' data-testid="login-form">
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                  Email Address
                </label>
                <input
                  type='email'
                  id='email'
                  data-testid="login-email-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm'
                  placeholder='Enter your email'
                  required
                />
              </div>

              <div>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
                  Password
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id='password'
                    data-testid="login-password-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm'
                    placeholder='Enter your password'
                    required
                  />
                  <button
                    type='button'
                    data-testid="toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors duration-200'
                  >
                    {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className='flex justify-end'>
                <Link
                  to='/forgot-password'
                  className='text-sm text-purple-600 hover:text-purple-500 transition-colors duration-200'
                >
                  Forgot your password?
                </Link>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='p-4 bg-red-50 border border-red-200 rounded-xl'
                >
                  <p className='text-sm text-red-600'>{error}</p>
                </motion.div>
              )}

              <motion.button
                type='submit'
                data-testid="login-submit-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className='w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              >
                {loading ? (
                  <div className='flex items-center justify-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In →'
                )}
              </motion.button>
            </form>

            {/* Social Login */}
            <div className='mt-8'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300'></div>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>or continue with</span>
                </div>
              </div>

              <div className='mt-6 grid grid-cols-2 gap-3'>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl bg-white/70 backdrop-blur-sm text-sm font-medium text-gray-700 hover:bg-white/90 transition-all duration-200'
                >
                  <svg className='w-5 h-5' viewBox='0 0 24 24'>
                    <path fill='currentColor' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
                    <path fill='currentColor' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
                    <path fill='currentColor' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
                    <path fill='currentColor' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
                  </svg>
                  <span className='ml-2'>Google</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl bg-white/70 backdrop-blur-sm text-sm font-medium text-gray-700 hover:bg-white/90 transition-all duration-200'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                  </svg>
                  <span className='ml-2'>GitHub</span>
                </motion.button>
              </div>

              {/* Demo Login Button */}
              <div className='mt-6'>
                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-300'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-2 bg-white text-gray-500'>or try demo</span>
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-2 gap-3'>
                  <motion.button
                    type='button'
                    onClick={() => handleDemoLogin('student')}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='py-3 rounded-xl font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-100 to-blue-100 hover:from-green-200 hover:to-blue-200 border border-green-300'
                  >
                    {loading ? (
                      <div className='flex items-center justify-center space-x-1'>
                        <div className='w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin'></div>
                      </div>
                    ) : (
                      '🎓 Demo Student'
                    )}
                  </motion.button>

                  <motion.button
                    type='button'
                    onClick={() => handleDemoLogin('teacher')}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className='py-3 rounded-xl font-semibold text-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border border-purple-300'
                  >
                    {loading ? (
                      <div className='flex items-center justify-center space-x-1'>
                        <div className='w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin'></div>
                      </div>
                    ) : (
                      '👨‍🏫 Demo Teacher'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            <p className='mt-8 text-center text-sm text-gray-600'>
              Don't have an account?{' '}
              <Link to='/signup' className='font-medium text-purple-600 hover:text-purple-500 transition-colors duration-200'>
                Sign up here →
              </Link>
            </p>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='mt-8 text-center'
          >
            <p className='text-white/80 text-sm mb-4'>Trusted by students from</p>
            <div className='flex justify-center space-x-4 text-white/60 text-xs'>
              <span>MIT</span>
              <span>•</span>
              <span>Stanford</span>
              <span>•</span>
              <span>Harvard</span>
              <span>•</span>
              <span>Oxford</span>
              <span>•</span>
              <span>Cambridge</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage