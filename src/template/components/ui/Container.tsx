import * as React from 'react'
import { mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string | number
  subgrid?: boolean
  // Radix compatibility props
  pb?: string | number
  py?: string | number
}

/**
 * Container component for consistent page width and padding
 * Replaces Radix Themes Container and Swiss Grid
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', subgrid, pb, py, children, ...props }, ref) => {
    // Map numeric sizes
    const sizeMap: Record<string, string> = {
      '1': 'sm',
      '2': 'sm',
      '3': 'md',
      '4': 'lg',
      '5': 'xl',
    }
    const mappedSize = sizeMap[String(size)] ?? size

    // Get spacing classes
    const spacingClasses = mapSpacingToClassName(
      Object.fromEntries(
        Object.entries({ pb, py }).filter(([_, v]) => v !== undefined),
      ) as Parameters<typeof mapSpacingToClassName>[0],
    )

    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8',
          {
            'sm': 'max-w-3xl',
            'md': 'max-w-5xl',
            'lg': 'max-w-7xl',
            'xl': 'max-w-[1440px]',
            'full': 'max-w-full',
          }[mappedSize as string] ?? 'max-w-7xl',
          subgrid && 'grid grid-cols-subgrid',
          spacingClasses,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Container.displayName = 'Container'
