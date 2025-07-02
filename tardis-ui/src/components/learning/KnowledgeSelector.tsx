import React from 'react'
import Knowledge from '@/components/Knowledge'
import FileUploader from '@/components/FileUploader'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'

interface KnowledgeSelectorProps {
  onKnowledgeClick: (id: string) => Promise<void>
}

const KnowledgeSelector: React.FC<KnowledgeSelectorProps> = ({ onKnowledgeClick }) => {
  const { knowledge } = useKnowledgeData()

  return (
    <div className='flex h-full flex-col md:flex-row'>
      {/* Sidebar for knowledge selection view */}
      <aside className='w-full overflow-y-auto border-b border-gray-700 bg-gray-800 p-3 text-white sm:p-4 md:w-1/4 md:min-w-[250px] md:max-w-[300px] md:border-b-0 md:border-r'>
        <FileUploader />
      </aside>

      {/* Knowledge grid */}
      <div className='flex-1 overflow-auto'>
        <Knowledge
          dimensions={knowledge}
          onClick={onKnowledgeClick}
        />
      </div>
    </div>
  )
}

export default KnowledgeSelector