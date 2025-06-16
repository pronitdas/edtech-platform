import React from 'react'

type LoaderSize = 'small' | 'medium' | 'large'
type LoaderColor = 'blue' | 'green' | 'red' | 'purple'

interface LoaderProps {
  size?: LoaderSize
  color?: LoaderColor
}

const Loader: React.FC<LoaderProps> = ({ size = 'medium', color = 'blue' }) => {
  // Size mapping
  const sizeMap: Record<LoaderSize, string> = {
    small: 'w-5 h-5',
    medium: 'w-10 h-10',
    large: 'w-14 h-14',
  }

  // Color mapping
  const colorMap: Record<LoaderColor, string> = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    purple: 'from-purple-400 to-purple-600',
  }

  return (
    <div className='flex items-center justify-center'>
      <div
        className={` ${sizeMap[size]} border-3 animate-spin rounded-full border-t-transparent bg-gradient-to-r ${colorMap[color]} `}
      />
    </div>
  )
}

export default Loader
