import * as React from 'react'
import { mapRadixColor, mapRadixSize, mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div' | 'label'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | string | number
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'default' | 'muted' | 'primary' | 'accent' | string
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
 * Text component for typography
 * Replaces Radix Themes Text
 */
export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({
    className,
    as: Component = 'p',
    size = 'base',
    weight = 'normal',
    color = 'default',
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
    // Map Radix values
    const mappedSize = mapRadixSize(size) ?? size
    const mappedColor = mapRadixColor(color) ?? color
    const spacingClasses = mapSpacingToClassName(
      Object.fromEntries(
        Object.entries({ m, mt, mr, mb, ml, mx, my, p, pt, pr, pb, pl, px, py }).filter(([_, v]) => v !== undefined),
      ) as Parameters<typeof mapSpacingToClassName>[0],
    )

    const sizeClasses = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'base': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
    }

    const colorClasses = {
      'default': 'text-foreground',
      'muted': 'text-muted-foreground',
      'primary': 'text-primary',
      'accent': 'text-accent-foreground',
      'destructive': 'text-destructive',
    }

    return (
      <Component
        ref={ref as any}
        className={cn(
          sizeClasses[mappedSize as keyof typeof sizeClasses] ?? 'text-base',
          weight === 'normal'
            ? 'font-normal'
            : weight === 'medium'
            ? 'font-medium'
            : weight === 'semibold'
            ? 'font-semibold'
            : weight === 'bold'
            ? 'font-bold'
            : undefined,
          colorClasses[mappedColor as keyof typeof colorClasses] ?? 'text-foreground',
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

Text.displayName = 'Text'
