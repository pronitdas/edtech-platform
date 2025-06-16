import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 dark:active:bg-primary-800',
        secondary:
          'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 dark:bg-secondary-600 dark:hover:bg-secondary-700 dark:active:bg-secondary-800',
        tertiary:
          'border border-primary-200 bg-transparent text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900',
        danger:
          'hover:bg-error-600 dark:bg-error-600 dark:active:bg-error-800 bg-error-500 text-white active:bg-error-700 dark:hover:bg-error-700',
        ghost:
          'text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900',
        link: 'h-auto p-0 text-primary-700 underline-offset-4 hover:underline dark:text-primary-400',
        success:
          'hover:bg-success-600 dark:bg-success-600 dark:active:bg-success-800 bg-success-500 text-white active:bg-success-700 dark:hover:bg-success-700',
        warning:
          'hover:bg-warning-600 dark:bg-warning-600 dark:active:bg-warning-800 bg-warning-500 text-white active:bg-warning-700 dark:hover:bg-warning-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Is the button currently loading
   */
  isLoading?: boolean
  /**
   * Icon to display before button text
   */
  leftIcon?: React.ReactNode
  /**
   * Icon to display after button text
   */
  rightIcon?: React.ReactNode
}

/**
 * Primary UI component for user interaction
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
        ) : leftIcon ? (
          <span className='mr-2'>{leftIcon}</span>
        ) : null}

        {children}

        {rightIcon && !isLoading && <span className='ml-2'>{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
