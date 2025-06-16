import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Helper text to display below textarea */
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, helperText, ...props }, ref) => {
    const id = React.useId()
    const errorId = `${id}-error`
    const helperId = `${id}-helper`

    return (
      <div>
        <textarea
          className={cn(
            'flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm',
            'placeholder:text-slate-500 dark:placeholder:text-slate-400',
            'focus-visible:outline-none focus-visible:ring-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'dark:border-error-400 dark:focus-visible:ring-error-400 border-error-500 focus-visible:ring-error-500'
              : 'border-slate-200 focus-visible:ring-slate-950 dark:border-slate-800 dark:focus-visible:ring-slate-300',
            className
          )}
          ref={ref}
          aria-invalid={error}
          aria-errormessage={error ? errorId : undefined}
          aria-describedby={helperText ? helperId : undefined}
          {...props}
        />
        {(helperText || errorMessage) && (
          <div className='mt-1.5 text-sm'>
            {error && errorMessage && (
              <p id={errorId} className='dark:text-error-400 text-error-500'>
                {errorMessage}
              </p>
            )}
            {!error && helperText && (
              <p id={helperId} className='text-slate-500 dark:text-slate-400'>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
