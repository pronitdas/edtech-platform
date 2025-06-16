'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import DOMPurify from 'dompurify'

// Utility function to generate image URLs
const getImageSrc = (src: string, knowledge_id: string) => {
  return `https://onyibiwnfwxatadlkygz.supabase.co/storage/v1/object/public/media/image/${knowledge_id}/${src}`
}

// Markdown Viewer Component
const MarkdownViewer: React.FC<{
  content: string
  images?: string[]
  knowledge_id: string
}> = ({ content, knowledge_id }) => {
  const slide = content.replace('```markdown', '')
  // Sanitize content
  const sanitizedContent = React.useMemo(() => {
    try {
      return DOMPurify.sanitize(slide || '')
    } catch (err) {
      console.error('Content sanitization failed:', err)
      return 'Error: Unable to render content.'
    }
  }, [slide])

  // Validate input
  if (typeof slide !== 'string') {
    console.warn('Invalid content passed to MarkdownViewer:', slide)
    return <div>Error: Invalid content format. Expected a string.</div>
  }

  return (
    <div className='h-full'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: props => (
            <h1
              className='mb-4 mt-8 text-3xl font-extrabold text-green-400'
              {...props}
            />
          ),
          h2: props => (
            <h2
              className='mb-3 mt-6 border-b border-green-700 text-2xl font-bold text-green-300'
              {...props}
            />
          ),
          h3: props => (
            <h3
              className='mb-2 mt-4 text-xl font-semibold text-green-200'
              {...props}
            />
          ),
          p: props => (
            <p
              className='my-4 whitespace-normal leading-relaxed text-gray-300'
              {...props}
            />
          ),
          ul: props => (
            <ul
              className='my-4 ml-6 list-disc space-y-2 text-gray-300'
              {...props}
            />
          ),
          ol: props => (
            <ol
              className='my-4 ml-6 list-decimal space-y-2 text-gray-300'
              {...props}
            />
          ),
          li: props => <li className='ml-2' {...props} />,
          table: props => (
            <div className='my-6 overflow-x-auto'>
              <table
                className='min-w-full divide-y divide-green-600 border border-green-600 text-gray-200'
                {...props}
              />
            </div>
          ),
          th: props => (
            <th
              className='border-b border-green-600 px-4 py-2 text-left font-semibold text-green-300'
              {...props}
            />
          ),
          td: props => (
            <td className='border-b border-green-600 px-4 py-2' {...props} />
          ),
          blockquote: props => (
            <blockquote
              className='border-l-4 border-green-500 pl-4 italic text-green-300'
              {...props}
            />
          ),
          code: props => (
            <code
              className='whitespace-normal rounded bg-gray-700 px-2 py-1 font-mono text-sm text-green-400'
              {...props}
            />
          ),
          img: ({ src, alt }) => {
            const resolvedSrc = src ? getImageSrc(src, knowledge_id) : ''
            return (
              <img
                src={resolvedSrc}
                alt={alt || ''}
                style={{
                  maxWidth: '100%',
                  border: '1px solid #ddd',
                  margin: '10px 0',
                }}
              />
            )
          },
          hr: props => (
            <hr className='my-8 border-t border-green-700' {...props} />
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownViewer
