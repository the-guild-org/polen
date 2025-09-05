import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import type { GridItemProps, ItemProps } from './types.js'
import { cx, extractLayoutProps, generateDataAttributes } from './utils.js'

/**
 * Grid item that spans the body zone (main 12-column area).
 *
 * @example
 * ```tsx
 * <Body>
 *   <Article />
 * </Body>
 * ```
 */
export const Body = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ children, asChild = false, subgrid = false, flow, className: userClassName, style: userStyle, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'

    // Extract Radix layout props
    const { className: layoutClassName, style: layoutStyle, ...restProps } = extractLayoutProps(props)

    // Build style with subgrid support
    const combinedStyle = React.useMemo(() => {
      const style: React.CSSProperties = { ...layoutStyle }

      if (subgrid) {
        style.display = 'grid'
        style.gridTemplateColumns = 'subgrid'
        // Default to 'row' (horizontal) layout, map to CSS grid-auto-flow
        const effectiveFlow = flow || 'row'
        style.gridAutoFlow = effectiveFlow === 'row' ? 'column' : 'row'
      }

      return { ...style, ...userStyle }
    }, [layoutStyle, subgrid, flow, userStyle])

    return (
      <Comp
        ref={ref}
        className={cx('swiss-item', layoutClassName, userClassName)}
        data-span='body'
        style={combinedStyle}
        {...restProps}
      >
        {children}
      </Comp>
    )
  },
)

Body.displayName = 'Swiss.Body'

/**
 * Grid item that spans the viewport zone (full viewport width).
 *
 * @example
 * ```tsx
 * <Viewport>
 *   <Hero />
 * </Viewport>
 * ```
 */
export const Viewport = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ children, asChild = false, subgrid = false, flow, className: userClassName, style: userStyle, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'

    // Extract Radix layout props
    const { className: layoutClassName, style: layoutStyle, ...restProps } = extractLayoutProps(props)

    // Build style with subgrid support
    const combinedStyle = React.useMemo(() => {
      const style: React.CSSProperties = { ...layoutStyle }

      if (subgrid) {
        style.display = 'grid'
        style.gridTemplateColumns = 'subgrid'
        // Default to 'row' (horizontal) layout, map to CSS grid-auto-flow
        const effectiveFlow = flow || 'row'
        style.gridAutoFlow = effectiveFlow === 'row' ? 'column' : 'row'
      }

      return { ...style, ...userStyle }
    }, [layoutStyle, subgrid, flow, userStyle])

    return (
      <Comp
        ref={ref}
        className={cx('swiss-item', layoutClassName, userClassName)}
        data-span='viewport'
        style={combinedStyle}
        {...restProps}
      >
        {children}
      </Comp>
    )
  },
)

Viewport.displayName = 'Swiss.Viewport'

/**
 * Grid item that spans the extended zone (subtly breaks out of body).
 *
 * @example
 * ```tsx
 * <Extended>
 *   <Feature />
 * </Extended>
 * ```
 */
export const Extended = React.forwardRef<HTMLDivElement, GridItemProps>(
  ({ children, asChild = false, subgrid = false, flow, className: userClassName, style: userStyle, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div'

    // Extract Radix layout props
    const { className: layoutClassName, style: layoutStyle, ...restProps } = extractLayoutProps(props)

    // Build style with subgrid support
    const combinedStyle = React.useMemo(() => {
      const style: React.CSSProperties = { ...layoutStyle }

      if (subgrid) {
        style.display = 'grid'
        style.gridTemplateColumns = 'subgrid'
        // Default to 'row' (horizontal) layout, map to CSS grid-auto-flow
        const effectiveFlow = flow || 'row'
        style.gridAutoFlow = effectiveFlow === 'row' ? 'column' : 'row'
      }

      return { ...style, ...userStyle }
    }, [layoutStyle, subgrid, flow, userStyle])

    return (
      <Comp
        ref={ref}
        className={cx('swiss-item', layoutClassName, userClassName)}
        data-span='extended'
        style={combinedStyle}
        {...restProps}
      >
        {children}
      </Comp>
    )
  },
)

Extended.displayName = 'Swiss.Extended'

/**
 * Flexible grid item with responsive span and column support.
 *
 * @example
 * ```tsx
 * // Responsive span
 * <Item span={{ initial: 'viewport', md: 'body' }}>
 *   <Content />
 * </Item>
 *
 * // Column span within body
 * <Item cols={6}>
 *   <HalfWidth />
 * </Item>
 * ```
 */
export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  (
    {
      children,
      asChild = false,
      subgrid = false,
      flow,
      span = 'body',
      cols,
      start,
      className: userClassName,
      style: userStyle,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'div'

    // Extract Radix layout props
    const { className: layoutClassName, style: layoutStyle, ...restProps } = extractLayoutProps(props)

    // Process cols to handle both number and string values, and combine with start if provided
    const processedCols = React.useMemo(() => {
      if (cols === undefined) return undefined

      // Helper function to combine start and cols
      const combineStartAndCols = (startVal: any, colsVal: any) => {
        // If cols is a string with explicit positioning, ignore start
        if (typeof colsVal === 'string') {
          return colsVal
        }
        // If cols is a number and start is provided, combine them
        if (typeof colsVal === 'number' && startVal !== undefined) {
          return `${startVal} / span ${colsVal}`
        }
        // Otherwise just convert number cols to span
        if (typeof colsVal === 'number') {
          return `span ${colsVal}`
        }
        return colsVal
      }

      // Handle responsive object for cols
      if (typeof cols === 'object' && !Array.isArray(cols)) {
        const processed: any = {}

        // Get start values (responsive or single)
        const startResponsive = start !== undefined && typeof start === 'object' && !Array.isArray(start)

        for (const [breakpoint, value] of Object.entries(cols)) {
          if (value !== undefined) {
            // Get corresponding start value for this breakpoint
            const startVal = startResponsive
              ? (start as any)[breakpoint]
              : start

            processed[breakpoint] = combineStartAndCols(startVal, value)
          }
        }
        return processed
      }

      // Handle single value
      return combineStartAndCols(start, cols)
    }, [cols, start])

    // Generate data attributes for responsive span behavior only when cols is not specified
    // When cols is provided, we're doing column spanning within a grid, not zone spanning
    const dataAttrs = React.useMemo(
      () =>
        cols !== undefined
          ? {} // No data-span when cols is specified
          : generateDataAttributes({
            span,
          }),
      [span, cols],
    )

    // Build combined style with grid-column from processed cols and subgrid support
    const combinedStyle = React.useMemo(() => {
      const style: any = { ...layoutStyle }

      // Apply grid-column based on processed cols
      if (processedCols !== undefined) {
        if (typeof processedCols === 'object') {
          // For responsive cols, we need to handle this differently
          // For now, just use the initial value if present
          if (processedCols.initial) {
            style.gridColumn = processedCols.initial
          }
          // TODO: Handle responsive values properly with CSS variables or media queries
        } else {
          style.gridColumn = processedCols
        }
      }

      // Add subgrid support
      if (subgrid) {
        style.display = 'grid'
        style.gridTemplateColumns = 'subgrid'
        // Default to 'row' (horizontal) layout, map to CSS grid-auto-flow
        const effectiveFlow = flow || 'row'
        style.gridAutoFlow = effectiveFlow === 'row' ? 'column' : 'row'
      }

      return { ...style, ...userStyle }
    }, [layoutStyle, processedCols, subgrid, flow, userStyle])

    return (
      <Comp
        ref={ref}
        className={cx('swiss-item', layoutClassName, userClassName)}
        {...dataAttrs}
        style={combinedStyle}
        {...restProps}
      >
        {children}
      </Comp>
    )
  },
)

Item.displayName = 'Swiss.Item'
