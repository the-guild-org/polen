import * as React from 'react'
import { cn } from '../../lib/utils.js'

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'solid' | 'soft' | 'outline' | 'ghost'
  color?: 'gray' | 'blue' | 'green' | 'red' | string // Allow any string for compatibility
  weight?: 'normal' | 'medium' | 'bold' // Add weight prop for compatibility
}

/**
 * Code component for inline code snippets
 */
export const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ className, variant = 'soft', color = 'gray', weight, children, ...props }, ref) => {
    const variantClasses = {
      'solid': 'bg-muted text-muted-foreground',
      'soft': 'bg-muted/50 text-foreground',
      'outline': 'border border-border',
      'ghost': 'bg-transparent',
    }

    const weightClasses = {
      'normal': 'font-normal',
      'medium': 'font-medium',
      'bold': 'font-bold',
    }

    return (
      <code
        ref={ref}
        className={cn(
          'relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm',
          variantClasses[variant],
          weight && weightClasses[weight as keyof typeof weightClasses],
          className,
        )}
        {...props}
      >
        {children}
      </code>
    )
  },
)

Code.displayName = 'Code'
