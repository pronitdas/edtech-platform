import React from 'react'

interface StyleProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
}

const Loader: React.FC<StyleProps> = ({ size = 'medium', color = 'blue' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  const colorClasses = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    purple: 'from-purple-400 to-purple-600'
  }

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeClasses[size]} rounded-full animate-spin
        border-4 border-t-transparent border-opacity-50
        bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
      ></div>
    </div>
  )
}

export default Loader