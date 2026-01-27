import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  delay?: number
  direction?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  delay = 300,
  direction = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      updatePosition()
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    let x = rect.left + scrollLeft + rect.width / 2
    let y = rect.top + scrollTop

    switch (direction) {
      case 'top':
        y -= 10
        break
      case 'bottom':
        y += rect.height + 10
        break
      case 'left':
        x = rect.left + scrollLeft - 10
        y += rect.height / 2
        break
      case 'right':
        x = rect.right + scrollLeft + 10
        y += rect.height / 2
        break
    }

    setPosition({ x, y })
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const tooltipElement = isVisible ? (
    <div
      className={`fixed z-50 pointer-events-none px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg whitespace-nowrap ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: direction === 'top' || direction === 'bottom' 
          ? 'translateX(-50%)' 
          : direction === 'left' 
          ? 'translateX(-100%)' 
          : 'translateX(0)',
      }}
    >
      {content}
      <div
        className="absolute w-0 h-0"
        style={{
          ...(direction === 'top' && {
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #111827',
          }),
          ...(direction === 'bottom' && {
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '4px solid #111827',
          }),
          ...(direction === 'left' && {
            right: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderLeft: '4px solid #111827',
          }),
          ...(direction === 'right' && {
            left: '-4px',
            top: '50%',
            transform: 'translateY(-50%)',
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderRight: '4px solid #111827',
          }),
        }}
      />
    </div>
  ) : null

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {typeof document !== 'undefined' && tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  )
}

// Provider and context components for shadcn/ui compatibility
const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

const TooltipTrigger: React.FC<{ 
  children: React.ReactNode
  asChild?: boolean
}> = ({ children, asChild = false }) => {
  if (asChild) {
    return <>{children}</>
  }
  return <div className="inline-block">{children}</div>
}

const TooltipContent: React.FC<{ 
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  return <span className={className}>{children}</span>
}

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent }
export default Tooltip