import React from 'react'

const KnowledgeList = ({ knowledgeBase, onSelectKnowledge, progress }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {knowledgeBase.map((item) => {
        const courseProgress = progress.filter(p => p.course_id === item.id)
        const completedChapters = courseProgress.filter(p => p.status === 'completed').length
        const totalChapters = courseProgress.length

        return (
          <div 
            key={item.id} 
            className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectKnowledge(item)}
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-gray-600 mt-2">{item.description}</p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{width: `${(completedChapters / totalChapters) * 100}%`}}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{completedChapters} / {totalChapters} chapters completed</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KnowledgeList

