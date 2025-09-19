import * as React from 'react'
import { mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | string
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black'
  // Radix compatibility props
  m?: string | number
  mt?: string | number
  mr?: string | number
  mb?: string | number
  ml?: string | number
  mx?: string | number
  my?: string | number
  p?: string | number
  pt?: string | number
  pr?: string | number
  pb?: string | number
  pl?: string | number
  px?: string | number
  py?: string | number
}

/**
 * Heading component for typography
 * Replaces Radix Themes Heading
 * Size 9 = largest, Size 1 = smallest (matching Radix convention)
 */
export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({
    className,
    as,
    size = '6',
    weight = 'bold',
    children,
    // Spacing props
    m,
    mt,
    mr,
    mb,
    ml,
    mx,
    my,
    p,
    pt,
    pr,
    pb,
    pl,
    px,
    py,
    ...props
  }, ref) => {
    // Default semantic level based on size if not specified
    const Component = as || (
      size === '9' || size === '8'
        ? 'h1'
        : size === '7' || size === '6'
        ? 'h2'
        : size === '5' || size === '4'
        ? 'h3'
        : 'h4'
    ) as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

    // Get spacing classes
    const spacingClasses = mapSpacingToClassName(
      Object.fromEntries(
        Object.entries({ m, mt, mr, mb, ml, mx, my, p, pt, pr, pb, pl, px, py }).filter(([_, v]) => v !== undefined),
      ) as Parameters<typeof mapSpacingToClassName>[0],
    )

    return (
      <Component
        ref={ref}
        className={cn(
          // Size classes
          {
            '1': 'text-xs',
            '2': 'text-sm',
            '3': 'text-base',
            '4': 'text-lg',
            '5': 'text-xl',
            '6': 'text-2xl',
            '7': 'text-3xl',
            '8': 'text-4xl',
            '9': 'text-5xl',
          }[String(size)] ?? 'text-2xl',
          // Weight classes
          {
            'normal': 'font-normal',
            'medium': 'font-medium',
            'semibold': 'font-semibold',
            'bold': 'font-bold',
            'black': 'font-black',
          }[weight],
          spacingClasses,
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

Heading.displayName = 'Heading'
