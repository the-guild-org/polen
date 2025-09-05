import { extractProps } from '@radix-ui/themes/helpers'
import { layoutPropDefs, marginPropDefs, paddingPropDefs } from '@radix-ui/themes/props'
import type { GridColumns, GridSpan, ResponsiveValue } from './types.js'

/**
 * Convert a value to pixels if it's a number, otherwise return as-is.
 */
const toPx = (value: number | string): string => {
  return typeof value === 'number' ? `${value}px` : value
}

/**
 * Generate CSS variables from responsive props.
 */
export const generateCSSVars = (props: {
  maxWidth?: ResponsiveValue<number | string>
  gutter?: ResponsiveValue<string>
  margins?: ResponsiveValue<string>
  columns?: ResponsiveValue<number>
}): Record<string, string | undefined> => {
  const vars: Record<string, string | undefined> = {}

  // Handle maxWidth
  if (props.maxWidth !== undefined) {
    if (typeof props.maxWidth === 'object') {
      if (props.maxWidth.initial !== undefined) vars['--swiss-max'] = toPx(props.maxWidth.initial)
      if (props.maxWidth.xs !== undefined) vars['--swiss-max-xs'] = toPx(props.maxWidth.xs)
      if (props.maxWidth.sm !== undefined) vars['--swiss-max-sm'] = toPx(props.maxWidth.sm)
      if (props.maxWidth.md !== undefined) vars['--swiss-max-md'] = toPx(props.maxWidth.md)
      if (props.maxWidth.lg !== undefined) vars['--swiss-max-lg'] = toPx(props.maxWidth.lg)
      if (props.maxWidth.xl !== undefined) vars['--swiss-max-xl'] = toPx(props.maxWidth.xl)
    } else {
      vars['--swiss-max'] = toPx(props.maxWidth)
    }
  }

  // Handle gutter
  if (props.gutter !== undefined) {
    if (typeof props.gutter === 'object') {
      if (props.gutter.initial !== undefined) vars['--swiss-gutter'] = props.gutter.initial
      if (props.gutter.xs !== undefined) vars['--swiss-gutter-xs'] = props.gutter.xs
      if (props.gutter.sm !== undefined) vars['--swiss-gutter-sm'] = props.gutter.sm
      if (props.gutter.md !== undefined) vars['--swiss-gutter-md'] = props.gutter.md
      if (props.gutter.lg !== undefined) vars['--swiss-gutter-lg'] = props.gutter.lg
      if (props.gutter.xl !== undefined) vars['--swiss-gutter-xl'] = props.gutter.xl
    } else {
      vars['--swiss-gutter'] = props.gutter
    }
  }

  // Handle margins
  if (props.margins !== undefined) {
    if (typeof props.margins === 'object') {
      if (props.margins.initial !== undefined) vars['--swiss-margins'] = props.margins.initial
      if (props.margins.xs !== undefined) vars['--swiss-margins-xs'] = props.margins.xs
      if (props.margins.sm !== undefined) vars['--swiss-margins-sm'] = props.margins.sm
      if (props.margins.md !== undefined) vars['--swiss-margins-md'] = props.margins.md
      if (props.margins.lg !== undefined) vars['--swiss-margins-lg'] = props.margins.lg
      if (props.margins.xl !== undefined) vars['--swiss-margins-xl'] = props.margins.xl
    } else {
      vars['--swiss-margins'] = props.margins
    }
  }

  // Handle columns
  if (props.columns !== undefined) {
    if (typeof props.columns === 'object') {
      if (props.columns.initial !== undefined) vars['--swiss-columns'] = String(props.columns.initial)
      if (props.columns.xs !== undefined) vars['--swiss-columns-xs'] = String(props.columns.xs)
      if (props.columns.sm !== undefined) vars['--swiss-columns-sm'] = String(props.columns.sm)
      if (props.columns.md !== undefined) vars['--swiss-columns-md'] = String(props.columns.md)
      if (props.columns.lg !== undefined) vars['--swiss-columns-lg'] = String(props.columns.lg)
      if (props.columns.xl !== undefined) vars['--swiss-columns-xl'] = String(props.columns.xl)
    } else {
      vars['--swiss-columns'] = String(props.columns)
    }
  }

  return vars
}

/**
 * Generate data attributes for responsive grid item behavior.
 */
export const generateDataAttributes = (props: {
  span?: ResponsiveValue<GridSpan>
  cols?: ResponsiveValue<GridColumns>
}): Record<string, string> => {
  const attrs: Record<string, string> = {}

  // Handle span
  if (props.span !== undefined) {
    if (typeof props.span === 'object') {
      if (props.span.initial !== undefined) attrs['data-span'] = props.span.initial
      if (props.span.xs !== undefined) attrs['data-span-xs'] = props.span.xs
      if (props.span.sm !== undefined) attrs['data-span-sm'] = props.span.sm
      if (props.span.md !== undefined) attrs['data-span-md'] = props.span.md
      if (props.span.lg !== undefined) attrs['data-span-lg'] = props.span.lg
      if (props.span.xl !== undefined) attrs['data-span-xl'] = props.span.xl
    } else {
      attrs['data-span'] = props.span
    }
  }

  // Handle cols
  if (props.cols !== undefined) {
    if (typeof props.cols === 'object') {
      if (props.cols.initial !== undefined) attrs['data-cols'] = String(props.cols.initial)
      if (props.cols.xs !== undefined) attrs['data-cols-xs'] = String(props.cols.xs)
      if (props.cols.sm !== undefined) attrs['data-cols-sm'] = String(props.cols.sm)
      if (props.cols.md !== undefined) attrs['data-cols-md'] = String(props.cols.md)
      if (props.cols.lg !== undefined) attrs['data-cols-lg'] = String(props.cols.lg)
      if (props.cols.xl !== undefined) attrs['data-cols-xl'] = String(props.cols.xl)
    } else {
      attrs['data-cols'] = String(props.cols)
    }
  }

  return attrs
}

/**
 * Combine class names, filtering out undefined values.
 */
export const cx = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Extract layout props (margin, padding, position, etc.) from component props.
 * Uses Radix UI Themes' extractProps to generate classNames and styles.
 */
export const extractLayoutProps = <T extends Record<string, any>>(props: T) => {
  // Use Radix's extractProps with layout and margin prop definitions
  // Note: layoutPropDefs already includes padding, width, and height internally
  const extracted = extractProps(props, layoutPropDefs, marginPropDefs)

  return extracted
}

/**
 * @deprecated Use extractLayoutProps instead
 */
export const extractSpacingProps = extractLayoutProps
