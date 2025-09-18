// UI Component Library
// These components use shadcn/ui patterns with Radix Primitives + Tailwind

import * as React from 'react'
import { cn } from '../../lib/utils.js'

// Core layout components
export { Box } from './Box.js'
export { Container } from './Container.js'
export { Flex } from './Flex.js'
export { Grid, GridItem } from './Grid.js'
export { Text } from './Text.js'

// Typography
export { Code } from './Code.js'
export { Heading } from './Heading.js'

// Interactive components
export { Button } from './Button.js'

// Display components
export { Badge } from './Badge.js'
export { Card, CardContent, CardHeader } from './Card.js'
export { Separator } from './Separator.js'

// shadcn/ui components - import but re-export as namespace for compatibility
import { Alert, AlertDescription, AlertTitle } from './alert.js'
import { HoverCard as HoverCardRoot, HoverCardContent, HoverCardTrigger } from './hover-card.js'
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select.js'
import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from './tabs.js'
import { ToggleGroupItem, ToggleGroupRoot } from './toggle-group.js'
import { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger } from './tooltip.js'

// Export HoverCard as namespace to match usage pattern
export const HoverCard = {
  Root: HoverCardRoot,
  Trigger: HoverCardTrigger,
  Content: HoverCardContent,
}

// Export Tabs as namespace to match usage pattern
export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
}

// Export Select as namespace to match usage pattern
export const Select = {
  Root: SelectRoot,
  Group: SelectGroup,
  Value: SelectValue,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Label: SelectLabel,
  Item: SelectItem,
  Separator: SelectSeparator,
}

// Export individual components too for direct usage
export { HoverCardContent, HoverCardRoot, HoverCardTrigger }
export { TabsContent, TabsList, TabsRoot, TabsTrigger }
export { ToggleGroupItem, ToggleGroupRoot as ToggleGroup }
export { Alert, AlertDescription, AlertTitle }

// Re-export types
export type { BadgeProps } from './Badge.js'
export type { BoxProps } from './Box.js'
export type { ButtonProps } from './Button.js'
export type { CardProps } from './Card.js'
export type { CodeProps } from './Code.js'
export type { ContainerProps } from './Container.js'
export type { FlexProps } from './Flex.js'
export type { GridItemProps, GridProps } from './Grid.js'
export type { HeadingProps } from './Heading.js'
export type { SeparatorProps } from './Separator.js'
export type { TextProps } from './Text.js'

// Compatibility exports for components used in the codebase
// IconButton - using Button with icon-only styling
import { Button } from './Button.js'
export const IconButton = Button

// Callout - using Alert as base with compatibility wrapper
import { Alert as AlertBase, AlertDescription as AlertDesc } from './alert.js'

// Create a wrapper that accepts color and variant props
const CalloutRoot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    color?: string
    variant?: 'surface' | 'soft' | 'outline' | string
  }
>(({ color, variant, ...props }, ref) => {
  // Map Radix color/variant to Alert variant
  const alertVariant = color === 'red' || color === 'amber' ? 'destructive' : 'default'
  return React.createElement(AlertBase, { ref, variant: alertVariant, ...props })
})

export const Callout = {
  Root: CalloutRoot,
  Icon: 'span' as any, // Will be replaced with proper icon component
  Text: AlertDesc,
}

// SegmentedControl - using ToggleGroup
export const SegmentedControl = {
  Root: ToggleGroupRoot,
  Item: ToggleGroupItem,
}

// Additional shadcn components
export { Link } from './link.js'
export type { LinkProps } from './link.js'
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './popover.js'

// MDX components
export const Em = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => <em ref={ref} {...props} />,
)
Em.displayName = 'Em'

export const Strong = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => <strong ref={ref} {...props} />,
)
Strong.displayName = 'Strong'

export const Quote = React.forwardRef<HTMLQuoteElement, React.BlockquoteHTMLAttributes<HTMLQuoteElement>>(
  (props, ref) => <blockquote ref={ref} className={cn('mt-6 border-l-2 pl-6 italic', props.className)} {...props} />,
)
Quote.displayName = 'Quote'

export const DataList = {
  Root: React.forwardRef<HTMLDListElement, React.HTMLAttributes<HTMLDListElement>>(
    (props, ref) => <dl ref={ref} className={cn('divide-y divide-border', props.className)} {...props} />,
  ),
  Item: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => (
      <div ref={ref} className={cn('px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0', props.className)} {...props} />
    ),
  ),
  Label: React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    (props, ref) => <dt ref={ref} className={cn('text-sm font-medium leading-6', props.className)} {...props} />,
  ),
  Value: React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    (props, ref) => (
      <dd ref={ref} className={cn('mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0', props.className)} {...props} />
    ),
  ),
}
DataList.Root.displayName = 'DataList.Root'
DataList.Item.displayName = 'DataList.Item'
DataList.Label.displayName = 'DataList.Label'
DataList.Value.displayName = 'DataList.Value'

// Table components
export const Table = {
  Root: React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
    (props, ref) => (
      <div className='w-full overflow-auto'>
        <table ref={ref} className={cn('w-full caption-bottom text-sm', props.className)} {...props} />
      </div>
    ),
  ),
  Header: React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    (props, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', props.className)} {...props} />,
  ),
  Body: React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
    (props, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', props.className)} {...props} />,
  ),
  Row: React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
    (props, ref) => (
      <tr
        ref={ref}
        className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', props.className)}
        {...props}
      />
    ),
  ),
  Cell: React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
    (props, ref) => (
      <td ref={ref} className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', props.className)} {...props} />
    ),
  ),
  ColumnHeaderCell: React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
    (props, ref) => (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
          props.className,
        )}
        {...props}
      />
    ),
  ),
}
Table.Root.displayName = 'Table.Root'
Table.Header.displayName = 'Table.Header'
Table.Body.displayName = 'Table.Body'
Table.Row.displayName = 'Table.Row'
Table.Cell.displayName = 'Table.Cell'
Table.ColumnHeaderCell.displayName = 'Table.ColumnHeaderCell'

// Tooltip component - using Radix Primitives as namespace
export const Tooltip = {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
}

// Export individual components too for direct usage
export { TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger }

// Theme wrapper - deprecated, use ThemeProvider from contexts
export const Theme = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>,
)
Theme.displayName = 'Theme'

// Type exports for compatibility
export type BoxOwnProps = React.HTMLAttributes<HTMLDivElement>
export type LayoutProps = React.HTMLAttributes<HTMLDivElement>
export type MarginProps = {
  m?: string | number
  mt?: string | number
  mr?: string | number
  mb?: string | number
  ml?: string | number
  mx?: string | number
  my?: string | number
}
export type ThemeProps = {
  appearance?: 'light' | 'dark' | 'inherit'
  accentColor?: string
  grayColor?: string
  radius?: 'none' | 'small' | 'medium' | 'large' | 'full'
  scaling?: string
}
export const colorPropDef = {
  type: 'enum',
  values: ['gray', 'blue', 'green', 'red', 'orange', 'purple', 'pink', 'cyan', 'yellow', 'indigo'],
} as const
