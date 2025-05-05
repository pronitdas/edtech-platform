import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the card */
  variant?: 'default' | 'elevated' | 'outlined';
  /** Optional header content */
  header?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Whether the card should take full height of its container */
  fullHeight?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  header,
  footer,
  children,
  fullHeight = false,
  className,
  ...props
}) => {
  const baseStyles = 'rounded-lg transition-shadow';
  const heightStyles = fullHeight ? 'h-full' : '';
  
  const variantStyles = {
    default: 'bg-gray-50 dark:bg-gray-800 shadow-md',
    elevated: 'bg-white dark:bg-gray-800 shadow-xl',
    outlined: 'border border-gray-200 dark:border-gray-700 bg-transparent'
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        heightStyles,
        'flex flex-col',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {header}
        </div>
      )}
      <div className="flex-1 p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 