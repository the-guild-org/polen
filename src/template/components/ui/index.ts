// UI Component Library
// These components use shadcn/ui patterns with Radix Primitives + Tailwind

import * as React from 'react'

// Core layout components
export { Box } from './Box.js'
export { Container } from './Container.js'
export { Flex } from './Flex.js'
export { Grid, GridItem } from './Grid.js'
export { Section } from './Section.js'

// Typography
export { Code } from './Code.js'
export { Heading } from './Heading.js'
export { Text } from './Text.js'

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
export type { SectionProps } from './Section.js'
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

// MDX components - simple wrappers for now
export const Em = 'em' as any
export const Strong = 'strong' as any
export const Quote = 'blockquote' as any
export const DataList = {
  Root: 'dl' as any,
  Item: 'div' as any,
  Label: 'dt' as any,
  Value: 'dd' as any,
}

// Table components
export const Table = {
  Root: 'table' as any,
  Header: 'thead' as any,
  Body: 'tbody' as any,
  Row: 'tr' as any,
  Cell: 'td' as any,
  ColumnHeaderCell: 'th' as any,
}

// Tooltip stub for now
export const Tooltip = 'span' as any

// Theme stub - no longer used but kept for compatibility during transition
export const Theme = 'div' as any

// Type exports for compatibility
import type { BoxProps as BoxPropsImport } from './Box.js'
export type BoxOwnProps = BoxPropsImport
export type LayoutProps = any
export type MarginProps = any
export type ThemeProps = any
export const colorPropDef = {} as any
