// TODO: Review and replace inline styles with Tailwind classes
import type { Content } from '#api/content/$'
import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { Texts } from '#template/components/Texts/index'
import { Str } from '@wollybeard/kit'
import { useContext } from 'react'
import { useLocation } from 'react-router'
import { getPathActiveReport, Link } from '../Link.js'
import { Box, Flex, Text } from '../ui/index.js'
import { SidebarContext } from './SidebarContext.js'

// Template layer extension: Allow React elements in title
interface TemplateItemLink extends Omit<Content.ItemLink, 'title'> {
  title: string | React.ReactNode
}

interface TemplateItemSection extends Omit<Content.ItemSection, 'title' | 'links'> {
  title: string | React.ReactNode
  links: TemplateItemLink[]
}

type TemplateItem = TemplateItemLink | TemplateItemSection

export const Items: React.FC<{ items: TemplateItem[] }> = ({ items }) => {
  return (
    <Flex direction='column' gap='2px'>
      {items.map((item, index) => (
        <Item
          key={`${item.pathExp}-${index}`}
          item={item}
        />
      ))}
    </Flex>
  )
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • SidebarItem
//
//

export const Item: React.FC<{ item: TemplateItem }> = ({ item }) => {
  if (item.type === `ItemLink`) {
    return <SBLink link={item} />
  }

  if (item.type === `ItemSection` && item.isLinkToo) {
    return <LinkedSection section={item} />
  }

  return (
    <Box pt='5' pb='2' px='4'>
      <section data-section={item.title}>
        <Text size='sm' weight='semibold' color='muted'>
          {item.title}
        </Text>
      </section>
    </Box>
  )
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • SidebarItemLink
//
//

const SBLink: React.FC<{
  link: TemplateItemLink | TemplateItemSection
}> = ({ link }) => {
  const location = useLocation()
  const { basePath } = useContext(SidebarContext)
  const currentPathExp = location.pathname
  const href = Api.Schema.Routing.joinSegmentsAndPaths(basePath, link.pathExp)
  const active = getPathActiveReport(href, currentPathExp)

  // Apply title case transformation to string titles for better readability
  const displayTitle = typeof link.title === 'string'
    ? Str.Case.title(link.title)
    : link.title

  return (
    <Link
      role='Sidebar Link'
      color={active.is ? `iris` : `gray`}
      data-testid={`sidebar-link-${link.pathExp}`}
      to={href}
      style={{
        display: `block`,
        textDecoration: `none`,
        color: active.is ? `var(--accent-12)` : undefined,
        backgroundColor: active.isDirect ? `var(--accent-3)` : active.isDescendant ? `var(--gray-2)` : `transparent`,
        borderRadius: `var(--radius-2)`,
      }}
    >
      <Box py='2' px='4'>{displayTitle}</Box>
    </Link>
  )
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Section
//
//

const Section: React.FC<{
  section: TemplateItemSection
}> = ({ section }) => {
  // Apply title case transformation to string titles for better readability
  const displayTitle = typeof section.title === 'string'
    ? Str.Case.title(section.title)
    : section.title

  return (
    <Box mt='8'>
      <Box ml='4' mb='2'>
        <Texts.MinorHeading color='gray'>
          {displayTitle}
        </Texts.MinorHeading>
      </Box>
      <Items items={section.links} />
    </Box>
  )
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • LinkedSection
//
//

const LinkedSection: React.FC<{
  section: TemplateItemSection
}> = ({ section }) => {
  return (
    <Box>
      <SBLink link={section} />
      {
        <Flex
          direction='column'
          gap='2'
          id={`section-${section.pathExp.replace(/\//g, `-`)}`}
          role='group'
          ml='5'
          py='2px'
          style={{
            borderLeft: `1px solid var(--gray-5)`,
          }}
        >
          {section.links.map((link, index) => (
            <SectionLink
              key={`${link.pathExp}-${index}`}
              link={link}
            />
          ))}
        </Flex>
      }
    </Box>
  )
}

const SectionLink: React.FC<{ link: TemplateItemLink }> = ({ link }) => {
  const location = useLocation()
  const { basePath } = useContext(SidebarContext)
  const href = Api.Schema.Routing.joinSegmentsAndPaths(basePath, link.pathExp)
  const active = getPathActiveReport(href, location.pathname)

  // Apply title case transformation to string titles for better readability
  const displayTitle = typeof link.title === 'string'
    ? Str.Case.title(link.title)
    : link.title

  return (
    <Link
      role='Sidebar Link'
      to={href}
      color={active.is ? `iris` : `gray`}
      style={{
        textDecoration: `none`,
        color: active.is ? `var(--accent-12)` : undefined,
        backgroundColor: active.isDirect ? `var(--accent-3)` : active.isDescendant ? `var(--gray-2)` : `transparent`,
        borderBottomRightRadius: `var(--radius-2)`,
        borderTopRightRadius: `var(--radius-2)`,
      }}
    >
      <Box py='2' px='4'>{displayTitle}</Box>
    </Link>
  )
}
