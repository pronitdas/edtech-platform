import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Key, 
  Settings, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import NavigationHeader from '../navigation/NavigationHeader'

interface ApiKey {
  id: number
  provider_name: string
  masked_key: string
  created_at: string
  last_used_at?: string
  is_active: boolean
}

interface Provider {
  name: string
  display_name: string
  description: string
  key_format: string
  setup_url: string
}

const ProfilePage: React.FC = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'general' | 'api-keys' | 'settings'>('general')
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [newApiKey, setNewApiKey] = useState({ provider: '', key: '' })
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadApiKeys()
    loadProviders()
  }, [])

  const loadApiKeys = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/api/v2/profile/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.api_keys || [])
      }
    } catch (error) {
      console.error('Failed to load API keys:', error)
    }
  }

  const loadProviders = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/api/v2/profile/providers`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
    }
  }

  const addApiKey = async () => {
    if (!newApiKey.provider || !newApiKey.key) {
      setMessage({ type: 'error', text: 'Please select a provider and enter an API key' })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/api/v2/profile/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider_name: newApiKey.provider,
          api_key: newApiKey.key
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message })
        setNewApiKey({ provider: '', key: '' })
        setShowNewKeyForm(false)
        await loadApiKeys()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to add API key' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add API key' })
    } finally {
      setLoading(false)
    }
  }

  const deleteApiKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete the API key for ${provider}?`)) {
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/api/v2/profile/api-keys/${provider}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message })
        await loadApiKeys()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.detail || 'Failed to delete API key' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete API key' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <div className="bg-gray-700 rounded-md px-3 py-2 text-white">
                    {user?.name || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <div className="bg-gray-700 rounded-md px-3 py-2 text-white">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <div className="bg-gray-700 rounded-md px-3 py-2 text-white capitalize">
                    {user?.role}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
                  <div className="bg-gray-700 rounded-md px-3 py-2 text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'api-keys':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">API Keys</h3>
                <button
                  onClick={() => setShowNewKeyForm(!showNewKeyForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add API Key</span>
                </button>
              </div>

              {showNewKeyForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 bg-gray-700 rounded-lg p-4"
                >
                  <h4 className="text-lg font-medium text-white mb-4">Add New API Key</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                      <select
                        value={newApiKey.provider}
                        onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                        className="w-full bg-gray-600 text-white rounded-md px-3 py-2"
                      >
                        <option value="">Select Provider</option>
                        {providers.map(provider => (
                          <option key={provider.name} value={provider.name}>
                            {provider.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                      <input
                        type="password"
                        value={newApiKey.key}
                        onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                        placeholder="Enter your API key"
                        className="w-full bg-gray-600 text-white rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-4">
                    <button
                      onClick={addApiKey}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md"
                    >
                      {loading ? 'Adding...' : 'Add Key'}
                    </button>
                    <button
                      onClick={() => setShowNewKeyForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No API keys configured</p>
                    <p className="text-sm">Add API keys to enable AI features</p>
                  </div>
                ) : (
                  apiKeys.map((apiKey) => {
                    const provider = providers.find(p => p.name === apiKey.provider_name)
                    return (
                      <div key={apiKey.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-5 w-5 text-green-400" />
                              <span className="font-medium text-white">
                                {provider?.display_name || apiKey.provider_name}
                              </span>
                            </div>
                            {apiKey.is_active && (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-300 mt-1">
                            Key: {apiKey.masked_key}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Added: {new Date(apiKey.created_at).toLocaleDateString()}
                            {apiKey.last_used_at && (
                              <span className="ml-4">
                                Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteApiKey(apiKey.provider_name)}
                          className="text-red-400 hover:text-red-300 p-2"
                          title="Delete API key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {providers.length > 0 && (
                <div className="mt-6 bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-3">Supported Providers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers.map((provider) => (
                      <div key={provider.name} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white">{provider.display_name}</div>
                          <div className="text-sm text-gray-300">{provider.description}</div>
                          <div className="text-xs text-gray-400">Format: {provider.key_format}</div>
                        </div>
                        <a
                          href={provider.setup_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Get API key"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Application Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Email Notifications</div>
                    <div className="text-sm text-gray-400">Receive updates about your learning progress</div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    Configure
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Privacy Settings</div>
                    <div className="text-sm text-gray-400">Control your data sharing preferences</div>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationHeader />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your account, API keys, and preferences</p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-800 text-green-200' 
                : 'bg-red-800 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-gray-800 rounded-lg p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage