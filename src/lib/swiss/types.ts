import type { LayoutProps, MarginProps } from '@radix-ui/themes/props'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Responsive value type that matches Radix UI Themes breakpoint pattern.
 * Allows values to change at different viewport sizes.
 */
export type ResponsiveValue<T> = T | {
  initial?: T
  xs?: T // 520px
  sm?: T // 768px
  md?: T // 1024px
  lg?: T // 1280px
  xl?: T // 1640px
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
 * Grid column positions including the end position (13) for 12-column grids.
 */
export type GridPosition = GridColumns | 13

/**
 * String literal types for explicit grid column positioning.
 * Provides type-safe CSS grid-column values.
 */
export type GridColumnString =
  | `${GridPosition}` // Start position: "1" through "13"
  | `${GridPosition} / ${GridPosition}` // Start / End: "1 / 3", "3 / 11", etc.
  | `${GridPosition} / span ${GridColumns}` // Start / Span: "1 / span 2", "3 / span 8"
  | `span ${GridColumns}` // Just span: "span 1" through "span 12"
  | 'auto'

/**
 * Props for the main Swiss Grid container component.
 * Creates a 12-column grid system with semantic zones for content placement.
 *
 * The grid defines three content zones:
 * - **Viewport**: Full viewport width
 * - **Extended**: Slightly wider than body, for emphasis
 * - **Body**: Main content area with 12 columns
 *
 * @example
 * ```tsx
 * <Swiss.Grid
 *   maxWidth={1440}
 *   gutter="var(--space-4)"
 *   margins="var(--space-5)"
 *   debug={true}
 * >
 *   <Swiss.Body>Main content</Swiss.Body>
 *   <Swiss.Extended>Featured image</Swiss.Extended>
 *   <Swiss.Viewport>Full-width hero</Swiss.Viewport>
 * </Swiss.Grid>
 * ```
 */
export interface GridProps extends LayoutProps, MarginProps {
  children: ReactNode
  /**
   * Gap between grid columns.
   * Typically uses Radix space variables for consistent spacing.
   *
   * @default "var(--space-4, 1.5rem)"
   *
   * @example
   * ```tsx
   * // Using Radix space scale
   * <Swiss.Grid gutter="var(--space-3)">
   *
   * // Responsive gaps
   * <Swiss.Grid gutter={{ initial: "var(--space-2)", md: "var(--space-4)" }}>
   * ```
   */
  gutter?: ResponsiveValue<string>
  /**
   * Minimum margins on either side of the grid.
   * These margins ensure content doesn't touch viewport edges.
   *
   * @default "var(--space-5, 2rem)"
   *
   * @example
   * ```tsx
   * // Consistent margins
   * <Swiss.Grid margins="var(--space-6)">
   *
   * // Responsive margins - tighter on mobile
   * <Swiss.Grid margins={{ initial: "var(--space-3)", md: "var(--space-5)" }}>
   * ```
   */
  margins?: ResponsiveValue<string>
  /**
   * Number of columns in the grid.
   * Defaults to 12 for desktop, automatically adjusts for tablet (8) and mobile (4).
   *
   * @default 12
   *
   * @example
   * ```tsx
   * // Custom column count
   * <Swiss.Grid columns={16}>
   *
   * // Responsive columns
   * <Swiss.Grid columns={{ initial: 4, sm: 8, md: 12 }}>
   * ```
   */
  columns?: ResponsiveValue<number>
  /**
   * Enable debug mode to show grid overlay.
   * Displays a visual grid to help with layout development.
   *
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
 * Props for semantic grid zone components (Body, Viewport, Extended).
 * These components automatically span their respective grid zones.
 *
 * @example
 * ```tsx
 * // Body zone - main content area
 * <Swiss.Body>
 *   <article>Article content constrained to body width</article>
 * </Swiss.Body>
 *
 * // Extended zone - slightly wider than body
 * <Swiss.Extended>
 *   <img src="feature.jpg" alt="Featured image breaks out slightly" />
 * </Swiss.Extended>
 *
 * // Viewport zone - full width
 * <Swiss.Viewport>
 *   <section>Full-width hero section</section>
 * </Swiss.Viewport>
 * ```
 */
export interface GridItemProps extends LayoutProps, MarginProps {
  children: ReactNode
  /**
   * Whether to merge props onto immediate child element.
   * When true, the component doesn't render its own element but merges
   * its props (including grid zone positioning) onto the child element.
   * Useful for maintaining semantic HTML while benefiting from grid zones.
   *
   * @default false
   *
   * @example
   * ```tsx
   * // Merges Body zone onto existing section element
   * <Swiss.Body asChild>
   *   <section>Content respects body zone without extra div</section>
   * </Swiss.Body>
   * ```
   */
  asChild?: boolean
  /**
   * Enable subgrid to propagate parent grid tracks to children.
   * When true, this item becomes a grid container with `grid-template-columns: subgrid`,
   * allowing its children to align with the parent grid columns.
   *
   * @default false
   *
   * @example
   * ```tsx
   * // Navbar that aligns its children to parent grid
   * <Swiss.Viewport subgrid flow="row">
   *   <Logo />        // Aligns to grid columns
   *   <Navigation />  // Aligns to grid columns
   *   <Actions />     // Aligns to grid columns
   * </Swiss.Viewport>
   * ```
   */
  subgrid?: boolean
  /**
   * Controls the layout direction when subgrid is enabled.
   * Uses Flexbox-like semantics for intuitive API.
   * - `'row'`: Horizontal layout (items placed left to right)
   * - `'column'`: Vertical layout (items placed top to bottom)
   * - `undefined`: Defaults to 'row' (horizontal) when subgrid is true
   *
   * Only applies when `subgrid=true`.
   *
   * @example
   * ```tsx
   * // Horizontal navbar (default)
   * <Swiss.Body subgrid>
   *   <Item cols={2}>Logo</Item>
   *   <Item cols={8}>Nav</Item>
   *   <Item cols={2}>Actions</Item>
   * </Swiss.Body>
   *
   * // Vertical sidebar
   * <Swiss.Extended subgrid flow="column">
   *   <Item>Home</Item>
   *   <Item>About</Item>
   *   <Item>Contact</Item>
   * </Swiss.Extended>
   * ```
   */
  flow?: 'row' | 'column'
  /**
   * Additional CSS class names for custom styling.
   */
  className?: string
  /**
   * Additional inline styles.
   * Useful for one-off adjustments.
   */
  style?: CSSProperties
}

/**
 * Props for the flexible Item component.
 * Provides intelligent column spanning with auto-placement or explicit positioning.
 * Inherits subgrid and flow capabilities from GridItemProps.
 */
export interface ItemProps extends GridItemProps {
  /**
   * Semantic grid zone to span.
   * - `'body'`: Main content area (12 columns)
   * - `'extended'`: Slightly wider than body
   * - `'viewport'`: Full viewport width
   *
   * @default 'body'
   *
   * @example
   * ```tsx
   * <Swiss.Item span="viewport">Full-width hero</Swiss.Item>
   * <Swiss.Item span="body">Article content</Swiss.Item>
   * <Swiss.Item span="extended">Featured image</Swiss.Item>
   * ```
   */
  span?: ResponsiveValue<GridSpan>
  /**
   * Column specification - intelligently handles both auto-placement and explicit positioning.
   *
   * **Number values** (1-12): Span that many columns in auto-flow
   * **String values**: Explicit CSS grid-column positioning
   *
   * When used with `start` prop, number values specify the span from the start position.
   *
   * @example
   * ```tsx
   * // Auto-placement - just specify size
   * <Swiss.Item cols={6}>Half width</Swiss.Item>
   *
   * // With start position
   * <Swiss.Item cols={7} start={5}>Start at col 5, span 7 columns</Swiss.Item>
   *
   * // Explicit placement - exact position
   * <Swiss.Item cols="3 / 11">Columns 3-10</Swiss.Item>
   * <Swiss.Item cols="1 / span 4">Start at 1, span 4</Swiss.Item>
   *
   * // Responsive
   * <Swiss.Item cols={{ initial: 12, md: 6, lg: "3 / 7" }}>
   *   Full width mobile, half tablet, cols 3-6 desktop
   * </Swiss.Item>
   * ```
   */
  cols?: ResponsiveValue<GridColumns | GridColumnString>
  /**
   * Starting column position (1-13) for explicit grid placement.
   * When used with numeric `cols`, creates `grid-column: start / span cols`.
   * Ignored when `cols` is a string value with explicit positioning.
   *
   * @example
   * ```tsx
   * // Start at column 5, span 7 columns
   * <Swiss.Item start={5} cols={7}>Content</Swiss.Item>
   *
   * // Responsive start position
   * <Swiss.Item start={{ initial: 1, md: 5 }} cols={7}>
   *   Start at col 1 mobile, col 5 desktop
   * </Swiss.Item>
   * ```
   */
  start?: ResponsiveValue<GridPosition>
}

/**
 * Props for the Swiss Grid SubGrid component.
 * SubGrid inherits grid tracks from its parent grid, enabling perfect alignment.
 */
export interface SubGridProps extends React.HTMLAttributes<HTMLDivElement>, LayoutProps {
  /**
   * Whether to merge props onto immediate child element.
   * When true, SubGrid doesn't render its own element.
   * @default false
   */
  asChild?: boolean
  /**
   * Number of parent grid columns this subgrid should span.
   * Supports responsive values for different breakpoints.
   *
   * @example
   * ```tsx
   * // Span 12 columns on mobile, 8 on desktop
   * <Swiss.SubGrid cols={{ initial: 12, md: 8 }}>
   * ```
   */
  cols?: ResponsiveValue<number>
  /**
   * Number of rows to span (optional).
   * If not provided, inherits all rows from parent grid.
   */
  rows?: ResponsiveValue<number>
  /**
   * Controls the layout direction of auto-placed items, using Flexbox-like semantics.
   * - `'row'`: Horizontal layout (items placed left to right)
   * - `'column'`: Vertical layout (items placed top to bottom)
   * - `undefined`: Don't set flow direction (inherit from parent or use CSS default)
   *
   * Note: Internally maps to CSS grid-auto-flow with inverted values for intuitive API:
   * - `'row'` → `grid-auto-flow: column` (fills columns first for horizontal appearance)
   * - `'column'` → `grid-auto-flow: row` (fills rows first for vertical appearance)
   *
   * @example
   * ```tsx
   * // Horizontal navbar layout
   * <Swiss.SubGrid flow="row">
   *   <Swiss.Item cols={2}>Logo</Swiss.Item>
   *   <Swiss.Item cols={8}>Navigation</Swiss.Item>
   *   <Swiss.Item cols={2}>Actions</Swiss.Item>
   * </Swiss.SubGrid>
   *
   * // Vertical sidebar layout
   * <Swiss.SubGrid flow="column">
   *   <Swiss.Item>Home</Swiss.Item>
   *   <Swiss.Item>About</Swiss.Item>
   *   <Swiss.Item>Contact</Swiss.Item>
   * </Swiss.SubGrid>
   * ```
   */
  flow?: 'row' | 'column'
}
