import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error state */
  error?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Helper text to display below input */
  helperText?: string
  /** Left icon */
  leftIcon?: React.ReactNode
  /** Right icon */
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      errorMessage,
      helperText,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const id = React.useId()
    const errorId = `${id}-error`
    const helperId = `${id}-helper`

    return (
      <div className='relative'>
        {leftIcon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-500'>
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-slate-500 dark:placeholder:text-slate-400',
            'focus-visible:outline-none focus-visible:ring-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
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
        {rightIcon && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-500'>
            {rightIcon}
          </div>
        )}
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
Input.displayName = 'Input'

export { Input }
