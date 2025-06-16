'use client'
import { useState } from 'react'

interface KnowledgeProps {
  dimensions: any[]
  onClick: (id: string) => void
}

export default function Knowledge({ dimensions, onClick }: KnowledgeProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Calculate pagination
  const totalPages = Math.ceil(dimensions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = dimensions.slice(startIndex, startIndex + itemsPerPage)

  // Get visible page numbers
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    return pageNumbers
  }

  return (
    <div className='flex min-h-screen flex-col bg-gradient-to-br from-purple-100 to-indigo-200 p-4'>
      <div className='grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {paginatedItems.map(item => (
          <KnowledgeCard
            key={item.id}
            item={item}
            onClick={() => onClick(item.id)}
          />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={page => setCurrentPage(page)}
        pageNumbers={getPageNumbers()}
      />
    </div>
  )
}

interface KnowledgeCardProps {
  item: any
  onClick: () => void
}

const KnowledgeCard = ({ item, onClick }: KnowledgeCardProps) => {
  // Group chapters by subtopic
  const subtopicMap: Record<string, any[]> = {}
  item.chapters_v1?.forEach((chapter: any) => {
    const subtopic = chapter.subtopic || 'General'
    if (!subtopicMap[subtopic]) {
      subtopicMap[subtopic] = []
    }
    subtopicMap[subtopic].push(chapter)
  })

  return (
    <div
      className='cursor-pointer rounded-xl bg-white shadow-lg transition-all duration-200 hover:translate-y-[-5px] hover:shadow-xl'
      onClick={onClick}
    >
      <div className='rounded-t-xl bg-gradient-to-r from-blue-500 to-teal-500 p-3'>
        <h2 className='truncate text-lg font-bold text-white'>{item.name}</h2>
      </div>
      <div className='h-[150px] overflow-y-auto rounded-b-xl p-3'>
        {Object.entries(subtopicMap).map(([subtopic, chapters]) => (
          <div key={subtopic} className='mb-2'>
            <h3 className='font-semibold text-gray-600'>{subtopic}</h3>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageNumbers: number[]
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageNumbers,
}: PaginationProps) => {
  if (totalPages <= 1) return null

  return (
    <div className='mt-6 flex flex-col items-center'>
      <div className='flex items-center space-x-1'>
        <PaginationButton
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          label='First'
        />

        <PaginationButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          label='Previous'
        />

        {pageNumbers.map(num => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`rounded px-3 py-1 ${
              currentPage === num
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {num}
          </button>
        ))}

        <PaginationButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          label='Next'
        />

        <PaginationButton
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          label='Last'
        />
      </div>

      <div className='mt-2 text-sm text-gray-600'>
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )
}

const PaginationButton = ({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled: boolean
  label: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`rounded bg-gray-200 px-2 py-1 ${
      disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-300'
    }`}
  >
    {label}
  </button>
)
