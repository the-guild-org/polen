import * as React from 'react'
import { cn } from '../../lib/utils.js'

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: '1' | '2' | '3' | '4'
  py?: string | number
  px?: string | number
}

/**
 * Section component for page sections
 */
export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, size = '3', py, px, children, ...props }, ref) => {
    const sizeClasses = {
      '1': 'py-4 md:py-6',
      '2': 'py-6 md:py-8',
      '3': 'py-8 md:py-12',
      '4': 'py-12 md:py-16',
    }

    return (
      <section
        ref={ref}
        className={cn(
          sizeClasses[size],
          className,
        )}
        style={{
          paddingTop: py,
          paddingBottom: py,
          paddingLeft: px,
          paddingRight: px,
        }}
        {...props}
      >
        {children}
      </section>
    )
  },
)

Section.displayName = 'Section'
