import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { mapRadixVariant } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | string
  size?: 'sm' | 'md' | 'lg' | string | number
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    // Map Radix variants
    const mappedVariant = mapRadixVariant(variant) ?? variant

    // Map numeric sizes if needed
    const sizeMap: Record<string, string> = {
      '1': 'sm',
      '2': 'md',
      '3': 'lg',
    }
    const mappedSize = sizeMap[String(size)] ?? size

    return (
      <Comp
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-colors rounded-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variants
          {
            'default': 'bg-primary text-primary-foreground hover:bg-primary/90',
            'secondary': 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            'destructive': 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            'outline': 'border border-border bg-background hover:bg-muted',
            'ghost': 'hover:bg-muted hover:text-muted-foreground',
          }[mappedVariant as string] ?? 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          // Sizes
          {
            'sm': 'h-8 px-3 text-sm',
            'md': 'h-10 px-4',
            'lg': 'h-12 px-6 text-lg',
          }[mappedSize as string] ?? 'h-10 px-4',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
