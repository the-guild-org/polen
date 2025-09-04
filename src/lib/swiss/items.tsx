import * as React from 'react'
import type { GridItemProps, ItemProps } from './types.js'
import { generateDataAttributes, cx } from './utils.js'

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
  ({ children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx('swiss-item', className)}
        data-span="body"
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }
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
  ({ children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx('swiss-item', className)}
        data-span="viewport"
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }
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
  ({ children, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx('swiss-item', className)}
        data-span="extended"
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }
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
  ({ children, span = 'body', cols, className, style, ...props }, ref) => {
    // Generate data attributes for responsive behavior
    const dataAttrs = React.useMemo(
      () => generateDataAttributes({ 
        span,
        ...(cols !== undefined && { cols })
      }),
      [span, cols]
    )

    return (
      <div
        ref={ref}
        className={cx('swiss-item', className)}
        {...dataAttrs}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Item.displayName = 'Swiss.Item'