import type { CSSProperties, ReactNode } from 'react'

/**
 * Responsive value type that matches Radix UI Themes breakpoint pattern.
 * Allows values to change at different viewport sizes.
 */
export type ResponsiveValue<T> = T | {
  initial?: T
  xs?: T  // 520px
  sm?: T  // 768px
  md?: T  // 1024px
  lg?: T  // 1280px
  xl?: T  // 1640px
}

/**
 * Grid span zones for content placement.
 */
export type GridSpan = 'body' | 'extended' | 'viewport'

/**
 * Number of columns (1-12) for grid items.
 */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/**
 * Props for the main Grid component.
 */
export interface GridProps {
  children: ReactNode
  /**
   * Maximum width of the body content area.
   * Can be a number (pixels), string (CSS value), or responsive object.
   * @default 1440
   */
  maxWidth?: ResponsiveValue<number | string>
  /**
   * Gap between grid columns.
   * Typically uses Radix space variables like "var(--space-4)".
   * @default "var(--space-4, 1.5rem)"
   */
  gutter?: ResponsiveValue<string>
  /**
   * Minimum margins on either side of the grid.
   * Typically uses Radix space variables like "var(--space-5)".
   * @default "var(--space-5, 2rem)"
   */
  margins?: ResponsiveValue<string>
  /**
   * Number of columns in the grid.
   * @default 12
   */
  columns?: ResponsiveValue<number>
  /**
   * Enable debug mode to show grid overlay.
   * @default false
   */
  debug?: boolean
  /**
   * Additional CSS class names.
   */
  className?: string
  /**
   * Additional inline styles.
   */
  style?: CSSProperties
}

/**
 * Props for grid item components (Body, Viewport, Extended).
 */
export interface GridItemProps {
  children: ReactNode
  /**
   * Additional CSS class names.
   */
  className?: string
  /**
   * Additional inline styles.
   */
  style?: CSSProperties
}

/**
 * Props for the flexible Item component.
 */
export interface ItemProps extends GridItemProps {
  /**
   * Which grid zone to span.
   * Can be responsive to change at different viewports.
   * @default 'body'
   */
  span?: ResponsiveValue<GridSpan>
  /**
   * Number of columns to span within the body zone.
   * Only applies when span is 'body'.
   */
  cols?: ResponsiveValue<GridColumns>
}