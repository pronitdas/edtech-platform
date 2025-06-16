import React, { useState } from 'react'
import { useUser } from '../contexts/UserContext'

export default function ProfilePage() {
  const { user, updateProfile, logout } = useUser()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await updateProfile({ name, email })
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      setError('Logout failed')
    }
  }

  if (!user) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Please log in to view your profile
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-2xl'>
        <div className='rounded-lg bg-white shadow'>
          <div className='px-4 py-5 sm:p-6'>
            <h1 className='mb-6 text-2xl font-bold text-gray-900'>
              Profile Settings
            </h1>

            {message && (
              <div className='mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700'>
                {message}
              </div>
            )}

            {error && (
              <div className='mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700'
                >
                  Full Name
                </label>
                <input
                  type='text'
                  id='name'
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                />
              </div>

              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700'
                >
                  Email Address
                </label>
                <input
                  type='email'
                  id='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
                />
              </div>

              <div className='flex justify-between'>
                <button
                  type='submit'
                  disabled={loading}
                  className='inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50'
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>

                <button
                  type='button'
                  onClick={handleLogout}
                  className='inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                >
                  Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className='mt-8 rounded-lg bg-white shadow'>
          <div className='px-4 py-5 sm:p-6'>
            <h2 className='mb-4 text-lg font-medium text-gray-900'>
              Account Information
            </h2>
            <dl className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2'>
              <div>
                <dt className='text-sm font-medium text-gray-500'>
                  Member since
                </dt>
                <dd className='mt-1 text-sm text-gray-900'>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className='text-sm font-medium text-gray-500'>User ID</dt>
                <dd className='mt-1 font-mono text-sm text-gray-900'>
                  {user.id}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
