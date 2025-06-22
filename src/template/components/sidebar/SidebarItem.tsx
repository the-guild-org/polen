import type { Content } from '#api/content/$'
import type { React } from '#dep/react/index'
import { Texts } from '#template/components/Texts/index'
import { Box, Flex } from '@radix-ui/themes'
import { useLocation } from 'react-router'
import { getPathActiveReport, Link } from '../Link.tsx'

export const Items: React.FC<{ items: Content.Item[] }> = ({ items }) => {
  return (
    <Flex direction='column' gap='2px'>
      {items.map((item) => (
        <Item
          key={item.pathExp}
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

export const Item: React.FC<{ item: Content.Item }> = ({ item }) => {
  if (item.type === `ItemLink`) {
    return <SBLink link={item} />
  }

  if (item.type === 'ItemSection' && item.isLinkToo) {
    return <LinkedSection section={item} />
  }

  return <Section section={item} />
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • SidebarItemLink
//
//

const SBLink: React.FC<{
  link: Content.ItemLink | Content.ItemSection
}> = ({ link }) => {
  const location = useLocation()
  const currentPathExp = location.pathname
  const active = getPathActiveReport(link.pathExp, currentPathExp)

  return (
    <Link
      role='Sidebar Link'
      color={active.is ? `iris` : `gray`}
      data-testid={`sidebar-link-${link.pathExp}`}
      to={`/${link.pathExp}`}
      style={{
        display: `block`,
        textDecoration: `none`,
        color: active.is ? `var(--accent-12)` : undefined,
        backgroundColor: active.isDirect ? `var(--accent-2)` : active.isdescendant ? `var(--accent-1)` : `transparent`,
        borderRadius: `var(--radius-2)`,
      }}
    >
      <Box py='2' px='4'>{link.title}</Box>
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
  section: Content.ItemSection
}> = ({ section }) => {
  return (
    <Box mt='8'>
      <Box ml='4' mb='2'>
        <Texts.MinorHeading color='gray'>
          {section.title}
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
  section: Content.ItemSection
}> = ({ section }) => {
  return (
    <Box>
      <SBLink link={section} />
      {
        <Flex
          direction='column'
          gap='2'
          id={`section-${section.pathExp.replace(/\//g, '-')}`}
          role='group'
          ml='5'
          py='2px'
          style={{
            borderLeft: `1px solid var(--gray-5)`,
          }}
        >
          {section.links.map((link) => (
            <SectionLink
              key={link.pathExp}
              link={link}
            />
          ))}
        </Flex>
      }
    </Box>
  )
}

const SectionLink: React.FC<{ link: Content.ItemLink }> = ({ link }) => {
  const location = useLocation()
  const active = getPathActiveReport(link.pathExp, location.pathname)

  return (
    <Link
      role='Sidebar Link'
      to={'/' + link.pathExp}
      color={active.is ? `iris` : `gray`}
      style={{
        textDecoration: `none`,
        color: active.is ? `var(--accent-12)` : undefined,
        backgroundColor: active.isDirect ? `var(--accent-2)` : active.isdescendant ? `var(--accent-1)` : `transparent`,
        borderBottomRightRadius: `var(--radius-2)`,
        borderTopRightRadius: `var(--radius-2)`,
      }}
    >
      <Box py='2' px='4'>{link.title}</Box>
    </Link>
  )
}
