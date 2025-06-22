import type { Content } from '#api/content/$'
import { Box } from '@radix-ui/themes'
import type { BoxOwnProps, LayoutProps, MarginProps } from '@radix-ui/themes/props'
import { Items } from './SidebarItem.tsx'

interface SidebarProps extends LayoutProps, MarginProps, BoxOwnProps {
  data: Content.Item[]
  style?: React.CSSProperties
}

export const Sidebar = ({ data, ...props }: SidebarProps) => {
  return (
    <Box
      data-testid='sidebar'
      role='Sidebar'
      {...props}
    >
      <style>
        {`
          div[role="Sidebar"] a:not([data-active]):hover {
            background-color: var(--iris-2) !important;
          }
        `}
      </style>
      <Items items={data} />
    </Box>
  )
}
