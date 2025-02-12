import React from 'react'

const StudentProgress = ({ progress }) => {
  const totalCourses = new Set(progress.map(p => p.course_id)).size
  const completedCourses = new Set(progress.filter(p => p.status === 'completed').map(p => p.course_id)).size

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
      <div className="flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{width: `${(completedCourses / totalCourses) * 100}%`}}
          ></div>
        </div>
        <span>{completedCourses} / {totalCourses} courses completed</span>
      </div>
    </div>
  )
}

export default StudentProgress

