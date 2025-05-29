import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    error?: boolean;
    required?: boolean;
  }
>(({ className, error, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      error ? 'text-error-500 dark:text-error-400' : 'text-slate-950 dark:text-slate-50',
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="text-error-500 dark:text-error-400 ml-1">*</span>}
  </LabelPrimitive.Root>
));

FormLabel.displayName = 'FormLabel';

export { FormLabel }; 