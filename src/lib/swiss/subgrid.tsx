import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import type { SubGridProps } from './types.js'
import { cx, extractLayoutProps, generateDataAttributes } from './utils.js'

/**
 * SubGrid component that inherits grid tracks from parent.
 * Supports asChild pattern for composition.
 *
 * @example
 * ```tsx
 * // Regular usage - creates div with subgrid
 * <SubGrid>
 *   <Logo />
 *   <Nav />
 * </SubGrid>
 *
 * // With asChild - merges onto child element
 * <SubGrid asChild>
 *   <header>
 *     <Logo />
 *     <Nav />
 *   </header>
 * </SubGrid>
 * ```
 */
export const SubGrid = React.forwardRef<HTMLDivElement, SubGridProps>(
  (
    {
      children,
      asChild = false,
      className: userClassName,
      style: userStyle,
      cols,
      rows,
      flow,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'div'

    // Extract Radix layout props
    const { className: layoutClassName, style: layoutStyle, ...restProps } = extractLayoutProps(props)

    // Generate responsive data attributes if cols/rows provided
    const dataAttrs = React.useMemo(
      () =>
        generateDataAttributes({
          ...(cols !== undefined && { cols }),
          ...(rows !== undefined && { rows }),
        } as any), // SubGrid uses rows which is not in the base type
      [cols, rows],
    )

    // Build style object with optional grid-auto-flow
    // Map flow prop to match Flexbox semantics for intuitive API:
    // - flow='row' (horizontal layout) → grid-auto-flow: column
    // - flow='column' (vertical layout) → grid-auto-flow: row
    const combinedStyle = React.useMemo(
      () => ({
        ...layoutStyle,
        ...(flow && { gridAutoFlow: flow === 'row' ? 'column' : 'row' }),
        ...userStyle,
      }),
      [layoutStyle, flow, userStyle],
    )

    return (
      <Comp
        ref={ref}
        className={cx('swiss-subgrid', layoutClassName, userClassName)}
        {...dataAttrs}
        style={combinedStyle}
        {...restProps}
      >
        {children}
      </Comp>
    )
  },
)

SubGrid.displayName = 'Swiss.SubGrid'
