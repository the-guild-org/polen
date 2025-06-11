import type { React } from '#dep/react/index'
import type { FileRouter } from '#lib/file-router/index'
import { Box, Flex, Text } from '@radix-ui/themes'
import { useLocation } from 'react-router'
import { Link } from '../Link.tsx'

export const Items: React.FC<{ items: FileRouter.Sidebar.Item[] }> = ({ items }) => {
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

export const Item: React.FC<{ item: FileRouter.Sidebar.Item }> = ({ item }) => {
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
  link: FileRouter.Sidebar.ItemLink | FileRouter.Sidebar.ItemSection
}> = ({ link }) => {
  const location = useLocation()
  const currentPathExp = location.pathname
  const active = getActiveInfo(link, currentPathExp)

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
  section: FileRouter.Sidebar.ItemSection
}> = ({ section }) => {
  // const active = getActiveInfo(section, currentPathExp)

  return (
    <Box // data-active={active.isDirect || undefined}
     // data-active-child={active.isdescendant || undefined}
    mt='8'>
      <Text
        weight='bold'
        color='gray'
        style={{
          color: 'var(--accent-11)',
          fontSize: '0.6rem',
          letterSpacing: '0.025rem',
          textTransform: 'uppercase',
        }}
        // Layout
        as='div'
        ml='4'
        mb='2' // no effect without being "div"
      >
        {section.title}
      </Text>
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
  section: FileRouter.Sidebar.ItemSection
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

const SectionLink: React.FC<{ link: FileRouter.Sidebar.ItemLink }> = ({ link }) => {
  const location = useLocation()
  const active = getActiveInfo(link, location.pathname)

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

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Helpers
//
//

const getActiveInfo = (
  link: FileRouter.Sidebar.Item,
  currentPathExp: string,
): { is: boolean; isDirect: boolean; isdescendant: boolean } => {
  // Normalize paths for comparison - remove leading slash if present
  const normalizedCurrentPath = currentPathExp.startsWith('/') ? currentPathExp.slice(1) : currentPathExp
  const isDirect = normalizedCurrentPath === link.pathExp
  const isdescendant = normalizedCurrentPath.startsWith(link.pathExp)
  const is = isDirect || isdescendant
  return {
    is,
    isDirect,
    isdescendant,
  }
}
