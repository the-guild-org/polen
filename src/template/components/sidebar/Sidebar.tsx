import type { FileRouter } from '#lib/file-router/index'
import { Box } from '@radix-ui/themes'
import type { BoxOwnProps, LayoutProps, MarginProps } from '@radix-ui/themes/props'
import { Items } from './SidebarItem.tsx'

interface SidebarProps extends LayoutProps, MarginProps, BoxOwnProps {
  data: FileRouter.Sidebar.Item[]
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
