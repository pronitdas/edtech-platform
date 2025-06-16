import React from 'react'
import { User } from 'lucide-react' // Using User as a fallback icon

// Assuming the Role interface is defined elsewhere and imported
// or defined inline if needed specifically here.
interface Role {
  name: string
  description: string
  icon: string // Expecting an icon identifier (e.g., emoji or class name)
  // Add other fields if necessary
}

interface StudentCardProps {
  role: Role
  onClick: (roleName: string) => void
}

const StudentCard: React.FC<StudentCardProps> = ({ role, onClick }) => {
  // Basic handling for icon - assumes emoji for now
  // TODO: Implement better icon handling (e.g., mapping identifiers to actual icons/components)
  const renderIcon = () => {
    // Simple check if it looks like an emoji
    // This is a basic heuristic and might need refinement
    const isEmoji = /\p{Emoji}/u.test(role.icon)

    if (isEmoji) {
      return (
        <span className='text-2xl' role='img' aria-label={`${role.name} icon`}>
          {role.icon}
        </span>
      )
    } else {
      // Fallback to a default icon if it's not an emoji
      // or use role.icon as a class name if using icon fonts
      return <User className='h-6 w-6 text-indigo-300' />
    }
  }

  return (
    <button
      onClick={() => onClick(role.name)}
      className='flex h-full w-full flex-col justify-between rounded-lg border border-gray-600 bg-gray-700 p-4 text-left transition-colors hover:border-indigo-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500'
    >
      <div>
        <div className='mb-3 flex items-center gap-3'>
          <div className='flex items-center justify-center rounded-full bg-gray-800 p-2'>
            {renderIcon()}
          </div>
          <h5 className='text-lg font-semibold text-white'>{role.name}</h5>
        </div>
        <p className='line-clamp-3 text-sm text-gray-300'>{role.description}</p>
      </div>
      {/* Optionally add a subtle hint to click */}
      {/* <span className="text-xs text-indigo-400 mt-3 self-end">Select Role</span> */}
    </button>
  )
}

export default StudentCard
