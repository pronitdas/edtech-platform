import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  GraduationCap, 
  PenTool, 
  ChevronDown,
  CheckCircle
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

type UserRole = 'student' | 'teacher' | 'content_creator'

interface RoleOption {
  value: UserRole
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const roleOptions: RoleOption[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'Learn with personalized AI tutoring and practice',
    icon: User,
    color: 'blue'
  },
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'Manage classrooms and track student progress',
    icon: GraduationCap,
    color: 'green'
  },
  {
    value: 'content_creator',
    label: 'Content Creator',
    description: 'Create and publish educational content',
    icon: PenTool,
    color: 'purple'
  }
]

interface RoleSelectorProps {
  className?: string
  showDescription?: boolean
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  className = '', 
  showDescription = true 
}) => {
  const { user, getUserRole, switchRole } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentRole = getUserRole()
  const currentRoleOption = roleOptions.find(role => role.value === currentRole)

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (newRole === currentRole) {
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      await switchRole(newRole)
      setIsOpen(false)
      // Refresh the page to load the new mode
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch role:', error)
      // Could add toast notification here
    } finally {
      setLoading(false)
    }
  }

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-400' },
      green: { bg: 'bg-green-600', text: 'text-green-400', border: 'border-green-400' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-400' }
    }
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant]
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
      >
        <div className="flex items-center space-x-3">
          {currentRoleOption && (
            <>
              <div className={`p-2 rounded-lg ${getColorClasses(currentRoleOption.color)}`}>
                <currentRoleOption.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-white font-medium">{currentRoleOption.label}</div>
                {showDescription && (
                  <div className="text-gray-400 text-sm">{currentRoleOption.description}</div>
                )}
              </div>
            </>
          )}
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 shadow-lg z-50"
          >
            <div className="p-2 space-y-1">
              {roleOptions.map((role) => {
                const isSelected = role.value === currentRole
                const Icon = role.icon
                
                return (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSwitch(role.value)}
                    disabled={loading}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors disabled:opacity-50 ${
                      isSelected 
                        ? 'bg-gray-700 border border-gray-600' 
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getColorClasses(role.color)}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-white font-medium">{role.label}</div>
                        <div className="text-gray-400 text-sm">{role.description}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RoleSelector