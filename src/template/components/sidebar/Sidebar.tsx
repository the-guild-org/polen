import type { Content } from '#api/content/$'
import { Box } from '@radix-ui/themes'
import type { BoxOwnProps, LayoutProps, MarginProps } from '@radix-ui/themes/props'
import { SidebarContext } from './SidebarContext.js'
import { Items } from './SidebarItem.js'

interface Props extends LayoutProps, MarginProps, BoxOwnProps {
  data: Content.Item[]
  basePath?: string
  style?: React.CSSProperties
  topContent?: React.ReactNode
}

export const Sidebar = ({ data, basePath, topContent, ...props }: Props) => {
  return (
    <SidebarContext.Provider value={{ basePath }}>
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
        {topContent && (
          <Box mb='4'>
            {topContent}
          </Box>
        )}
        <Items items={data} />
      </Box>
    </SidebarContext.Provider>
  )
}
