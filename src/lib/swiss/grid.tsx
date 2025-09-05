import * as React from 'react'
import type { GridProps } from './types.js'
import { cx, extractLayoutProps, generateCSSVars } from './utils.js'

/**
 * Swiss Grid container component.
 *
 * Creates a 12-column grid with semantic zones for content placement.
 * Integrates with Radix UI Themes space scale for consistent spacing.
 *
 * @example
 * ```tsx
 * <Grid maxWidth={1440} gutter="var(--space-4)">
 *   {children}
 * </Grid>
 * ```
 */
export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      maxWidth = 1440,
      gutter,
      margins,
      columns = 12,
      debug = false,
      className: userClassName,
      style: userStyle,
      ...props
    },
    ref,
  ) => {
    // Extract Radix layout props (margin, padding, position, etc.)
    const { className: layoutClassName, style: layoutStyle, ...restProps } = extractLayoutProps(props)

    // Generate CSS variables from props
    const cssVars = React.useMemo(
      () =>
        generateCSSVars({
          maxWidth,
          ...(gutter !== undefined && { gutter }),
          ...(margins !== undefined && { margins }),
          columns,
        }),
      [maxWidth, gutter, margins, columns],
    )

    return (
      <div
        ref={ref}
        className={cx('swiss-grid', debug && 'swiss-grid--debug', layoutClassName, userClassName)}
        style={{ ...cssVars, ...layoutStyle, ...userStyle }}
        {...restProps}
      >
        {children}
      </div>
    )
  },
)

Grid.displayName = 'Swiss.Grid'
