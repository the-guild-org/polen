import * as React from 'react'
import { mapRadixGap, mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | string | number
  display?: 'flex' | 'inline-flex' | string
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
 * Flex component for flexible box layouts
 * Replaces Radix Themes Flex
 */
export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({
    className,
    direction = 'row',
    wrap = 'nowrap',
    justify = 'start',
    align = 'stretch',
    gap = 'none',
    display = 'flex',
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
    // Map numeric gap values
    const mappedGap = mapRadixGap(gap) ?? gap
    // Get spacing classes
    const spacingClasses = mapSpacingToClassName(
      Object.fromEntries(
        Object.entries({ m, mt, mr, mb, ml, mx, my, p, pt, pr, pb, pl, px, py }).filter(([_, v]) => v !== undefined),
      ) as Parameters<typeof mapSpacingToClassName>[0],
    )

    const gapClasses = {
      'none': 'gap-0',
      'sm': 'gap-2',
      'md': 'gap-4',
      'lg': 'gap-6',
      'xl': 'gap-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          display === 'inline-flex' ? 'inline-flex' : 'flex',
          {
            'row': 'flex-row',
            'column': 'flex-col',
            'row-reverse': 'flex-row-reverse',
            'column-reverse': 'flex-col-reverse',
          }[direction],
          {
            'wrap': 'flex-wrap',
            'nowrap': 'flex-nowrap',
            'wrap-reverse': 'flex-wrap-reverse',
          }[wrap],
          {
            'start': 'justify-start',
            'end': 'justify-end',
            'center': 'justify-center',
            'between': 'justify-between',
            'around': 'justify-around',
            'evenly': 'justify-evenly',
          }[justify],
          {
            'start': 'items-start',
            'end': 'items-end',
            'center': 'items-center',
            'baseline': 'items-baseline',
            'stretch': 'items-stretch',
          }[align],
          gapClasses[mappedGap as keyof typeof gapClasses],
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

Flex.displayName = 'Flex'
