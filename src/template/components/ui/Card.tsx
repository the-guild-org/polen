import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { mapRadixSize } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'classic' | 'ghost'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | string | number
  asChild?: boolean
}

/**
 * Card component for content containers
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'surface', size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'

    // Map size prop if provided
    const mappedSize = mapRadixSize(size)

    // Size classes for padding
    const sizeClasses = {
      'xs': 'p-2',
      'sm': 'p-3',
      'base': 'p-4',
      'lg': 'p-6',
      'xl': 'p-8',
    }

    return (
      <Comp
        ref={ref}
        className={cn(
          'rounded-lg',
          {
            'surface': 'bg-card text-card-foreground shadow-sm border',
            'classic': 'bg-background border shadow-md',
            'ghost': 'bg-transparent',
          }[variant],
          mappedSize && sizeClasses[mappedSize as keyof typeof sizeClasses],
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)

Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />,
)
CardContent.displayName = 'CardContent'
