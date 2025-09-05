import type { Content } from '#api/content/$'
import type { React } from '#dep/react/index'
import { Box } from '@radix-ui/themes'
import type { BoxOwnProps, LayoutProps, MarginProps } from '@radix-ui/themes/props'
import { SidebarContext } from './SidebarContext.js'
import { Items } from './SidebarItem.js'

// Template layer extension: Allow React elements in title
interface TemplateItemLink extends Omit<Content.ItemLink, 'title'> {
  title: string | React.ReactNode
}

interface TemplateItemSection extends Omit<Content.ItemSection, 'title' | 'links'> {
  title: string | React.ReactNode
  links: TemplateItemLink[]
}

type TemplateItem = TemplateItemLink | TemplateItemSection

interface Props extends LayoutProps, MarginProps, BoxOwnProps {
  data: TemplateItem[]
  basePath?: string
  style?: React.CSSProperties
  topContent?: React.ReactNode
}

export const Sidebar = ({ data, basePath, topContent, ...props }: Props) => {
  return (
    <SidebarContext.Provider value={basePath !== undefined ? { basePath } : {}}>
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
