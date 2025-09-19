import * as React from 'react'
import { mapRadixColor, mapRadixSize, mapRadixVariant, mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | string
  color?: 'gray' | 'blue' | 'green' | 'red' | string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | string | number
  ml?: string | number
}

/**
 * Badge component for status indicators and labels
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', color, size, ml, ...props }, ref) => {
    // Map Radix props
    const mappedVariant = mapRadixVariant(variant) ?? variant
    const mappedColor = mapRadixColor(color)
    const mappedSize = mapRadixSize(size)
    const spacingClasses = ml !== undefined ? mapSpacingToClassName({ ml }) : ''

    // Map numeric sizes
    const sizeClasses = {
      'xs': 'text-xs px-2 py-0.5',
      'sm': 'text-sm px-2.5 py-0.5',
      'base': 'text-base px-3 py-1',
      'lg': 'text-lg px-4 py-1.5',
      'xl': 'text-xl px-5 py-2',
    }

    const variantClasses = {
      'default': 'bg-primary text-primary-foreground',
      'secondary': 'bg-secondary text-secondary-foreground',
      'destructive': 'bg-destructive text-destructive-foreground',
      'outline': 'border text-foreground',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-semibold transition-colors',
          // Apply size classes
          sizeClasses[mappedSize as keyof typeof sizeClasses] ?? 'text-xs px-2.5 py-0.5',
          // Apply variant/color classes
          variantClasses[mappedVariant as keyof typeof variantClasses] ?? 'bg-secondary text-secondary-foreground',
          spacingClasses,
          className,
        )}
        {...props}
      />
    )
  },
)

Badge.displayName = 'Badge'
