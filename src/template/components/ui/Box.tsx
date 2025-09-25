import * as React from 'react'
import { mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
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
  // Legacy prop support
  position?: string
  inset?: string
  top?: string
  left?: string
  bottom?: string
  width?: string
  display?: string | {
    initial?: string
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
  }
}

/**
 * Box component - a simple div with className merging
 * Replaces Radix Themes Box
 */
export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({
    className,
    as: Component = 'div',
    children,
    style,
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
    // Legacy props
    position,
    inset,
    top,
    left,
    bottom,
    width,
    display,
    ...props
  }, ref) => {
    // Get spacing classes
    const spacingClasses = mapSpacingToClassName(
      Object.fromEntries(
        Object.entries({ m, mt, mr, mb, ml, mx, my, p, pt, pr, pb, pl, px, py }).filter(([_, v]) => v !== undefined),
      ) as Parameters<typeof mapSpacingToClassName>[0],
    )

    // Build display classes for responsive display
    let displayClasses = ''
    if (display) {
      if (typeof display === 'string') {
        displayClasses = display === 'none'
          ? 'hidden'
          : display === 'block'
          ? 'block'
          : display === 'inline-block'
          ? 'inline-block'
          : display === 'flex'
          ? 'flex'
          : display === 'inline-flex'
          ? 'inline-flex'
          : display === 'grid'
          ? 'grid'
          : ''
      } else {
        // Handle responsive display object
        const displayMap: Record<string, string> = {
          'none': 'hidden',
          'block': 'block',
          'inline-block': 'inline-block',
          'flex': 'flex',
          'inline-flex': 'inline-flex',
          'grid': 'grid',
        }

        const responsiveClasses: string[] = []
        if (display.initial) responsiveClasses.push(displayMap[display.initial] || '')
        if (display.xs) responsiveClasses.push(`xs:${displayMap[display.xs]}` || '')
        if (display.sm) responsiveClasses.push(`sm:${displayMap[display.sm]}` || '')
        if (display.md) responsiveClasses.push(`md:${displayMap[display.md]}` || '')
        if (display.lg) responsiveClasses.push(`lg:${displayMap[display.lg]}` || '')
        if (display.xl) responsiveClasses.push(`xl:${displayMap[display.xl]}` || '')

        displayClasses = responsiveClasses.join(' ')
      }
    }

    // Build inline styles for positioning
    const positionStyle = {
      position,
      inset,
      top,
      left,
      bottom,
      width,
      ...style,
    } as React.CSSProperties

    return (
      <Component
        ref={ref}
        className={cn(spacingClasses, displayClasses, className)}
        style={positionStyle}
        {...props}
      >
        {children}
      </Component>
    )
  },
)

Box.displayName = 'Box'
