import type { FileRouter } from '#lib/file-router/index'
import { Box } from '@radix-ui/themes'
import { Items } from './SidebarItem.tsx'

interface SidebarProps {
  items: FileRouter.Sidebar.Item[]
}

export const Sidebar = ({ items }: SidebarProps) => {
  return (
    <Box
      data-testid='sidebar'
      role='Sidebar'
      flexShrink='0'
    >
      <style>
        {`
          div[role="Sidebar"] a:not([data-active]):hover {
            background-color: var(--iris-2) !important;
          }
        `}
      </style>
      <Items items={items} />
    </Box>
  )
}
