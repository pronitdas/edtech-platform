import React, { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

export interface DialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Callback when dialog close is requested */
  onClose: () => void
  /** Dialog title */
  title?: React.ReactNode
  /** Dialog description for accessibility */
  description?: React.ReactNode
  /** Dialog content */
  children: React.ReactNode
  /** Optional footer content */
  footer?: React.ReactNode
  /** Maximum width of the dialog */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Additional class names */
  className?: string
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  // Handle clicking on the backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialogDimensions = e.currentTarget.getBoundingClientRect()
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'relative bg-transparent p-0 backdrop:bg-gray-900/75 backdrop:backdrop-blur-sm',
        'open:flex open:items-center open:justify-center',
        'h-full max-h-[100vh] w-full',
        className
      )}
      onClick={handleBackdropClick}
      onClose={onClose}
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div
        className={cn(
          'w-full rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800',
          'transform transition-all',
          maxWidthClasses[maxWidth]
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        {title && (
          <h3
            id='dialog-title'
            className='text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100'
          >
            {title}
          </h3>
        )}

        {/* Description */}
        {description && (
          <div
            id='dialog-description'
            className='mt-2 text-sm text-gray-500 dark:text-gray-400'
          >
            {description}
          </div>
        )}

        {/* Content */}
        <div className={cn('mt-4', !title && !description && 'mt-0')}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className='mt-6 flex justify-end space-x-3'>{footer}</div>
        )}
      </div>
    </dialog>
  )
}

export default Dialog
