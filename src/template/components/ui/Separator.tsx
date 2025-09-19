import * as React from 'react'
import { mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
  size?: string | number
  my?: string | number
}

/**
 * Separator component for visual separation
 */
export const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', size, my, ...props }, ref) => {
    // Get spacing classes for my prop
    const spacingClasses = my !== undefined ? mapSpacingToClassName({ my }) : ''

    return (
      <hr
        ref={ref}
        className={cn(
          'shrink-0 bg-border',
          orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
          spacingClasses,
          className,
        )}
        {...props}
      />
    )
  },
)

Separator.displayName = 'Separator'
