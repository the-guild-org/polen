import * as React from 'react'
import { mapSpacingToClassName } from '../../lib/radix-compat.js'
import { cn } from '../../lib/utils.js'

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  columns?: string | number | {
    initial?: string
    xs?: string
    sm?: string
    md?: string
    lg?: string
    xl?: string
  }
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  align?: string
  mb?: string | number
}

/**
 * Grid component for layout
 * Replaces both Radix Themes Grid and Swiss Grid
 */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 12, columns, gap = 'md', align, mb, children, ...props }, ref) => {
    // Handle responsive columns prop
    let columnsClasses = ''
    if (columns) {
      if (typeof columns === 'string' || typeof columns === 'number') {
        const colNum = String(columns)
        columnsClasses = colNum === '12'
          ? 'grid-cols-12'
          : colNum === '6'
          ? 'grid-cols-6'
          : colNum === '4'
          ? 'grid-cols-4'
          : colNum === '3'
          ? 'grid-cols-3'
          : colNum === '2'
          ? 'grid-cols-2'
          : colNum === '1'
          ? 'grid-cols-1'
          : `grid-cols-${colNum}`
      } else {
        const responsiveClasses: string[] = []
        if (columns.initial) responsiveClasses.push(`grid-cols-${columns.initial}`)
        if (columns.xs) responsiveClasses.push(`xs:grid-cols-${columns.xs}`)
        if (columns.sm) responsiveClasses.push(`sm:grid-cols-${columns.sm}`)
        if (columns.md) responsiveClasses.push(`md:grid-cols-${columns.md}`)
        if (columns.lg) responsiveClasses.push(`lg:grid-cols-${columns.lg}`)
        if (columns.xl) responsiveClasses.push(`xl:grid-cols-${columns.xl}`)
        columnsClasses = responsiveClasses.join(' ')
      }
    }

    // Handle align prop
    const alignClasses = align === 'center'
      ? 'items-center'
      : align === 'start'
      ? 'items-start'
      : align === 'end'
      ? 'items-end'
      : align === 'stretch'
      ? 'items-stretch'
      : ''

    // Get spacing classes
    const spacingClasses = mb !== undefined ? mapSpacingToClassName({ mb }) : ''

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          // Use columns prop if provided, otherwise fall back to cols
          columnsClasses || {
            1: 'grid-cols-1',
            2: 'grid-cols-1 md:grid-cols-2',
            3: 'grid-cols-1 md:grid-cols-3',
            4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
            6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6',
            12: 'grid-cols-1 lg:grid-cols-12',
          }[cols],
          {
            'none': 'gap-0',
            'sm': 'gap-4',
            'md': 'gap-6',
            'lg': 'gap-8',
            'xl': 'gap-12',
          }[gap],
          alignClasses,
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

Grid.displayName = 'Grid'

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  cols?: number | { initial?: number; sm?: number; md?: number; lg?: number }
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
}

/**
 * Grid item for use within Grid component
 */
export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, cols, start, children, ...props }, ref) => {
    // Support cols as an alias for span for compatibility
    const colSpan = span || (typeof cols === 'number' ? cols : undefined)
    const responsiveCols = typeof cols === 'object' ? cols : undefined

    // Build responsive classes
    const responsiveClasses = responsiveCols
      ? [
        responsiveCols.initial && `col-span-${responsiveCols.initial}`,
        responsiveCols.sm && `sm:col-span-${responsiveCols.sm}`,
        responsiveCols.md && `md:col-span-${responsiveCols.md}`,
        responsiveCols.lg && `lg:col-span-${responsiveCols.lg}`,
      ].filter(Boolean).join(' ')
      : ''

    return (
      <div
        ref={ref}
        className={cn(
          colSpan && {
            1: 'col-span-1',
            2: 'col-span-2',
            3: 'col-span-3',
            4: 'col-span-4',
            5: 'col-span-5',
            6: 'col-span-6',
            7: 'col-span-7',
            8: 'col-span-8',
            9: 'col-span-9',
            10: 'col-span-10',
            11: 'col-span-11',
            12: 'col-span-12',
          }[colSpan],
          responsiveClasses,
          start && {
            1: 'col-start-1',
            2: 'col-start-2',
            3: 'col-start-3',
            4: 'col-start-4',
            5: 'col-start-5',
            6: 'col-start-6',
            7: 'col-start-7',
            8: 'col-start-8',
            9: 'col-start-9',
            10: 'col-start-10',
            11: 'col-start-11',
            12: 'col-start-12',
          }[start],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

GridItem.displayName = 'GridItem'
