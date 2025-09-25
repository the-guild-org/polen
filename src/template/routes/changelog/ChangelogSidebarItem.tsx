// TODO: Review and replace inline styles with Tailwind classes
import { Change, Revision } from 'graphql-kit'
import { Box, Flex, Text } from '../../components/ui/index.js'
import { renderDate } from './utils.js'

export const ChangelogSidebarItem: React.FC<{
  revision: Revision
  isActive: boolean
}> = ({ revision, isActive }) => {
  const counts = calculateCounts(revision)

  return (
    <Box mb='2'>
      <a
        href={`#${revision.date}`}
        className={`no-underline flex items-center justify-between py-2 px-3 rounded text-inherit transition-colors ${
          isActive ? 'bg-gray-200/50' : 'bg-transparent hover:bg-gray-100'
        }`}
        onClick={(e) => {
          e.preventDefault()
          // Update URL hash
          window.history.pushState(null, '', `#${revision.date}`)
          // Dispatch custom event for pushState
          window.dispatchEvent(new Event('pushstate'))
          // Smooth scroll to element
          document.getElementById(revision.date)?.scrollIntoView({ behavior: 'smooth' })
        }}
      >
        <Text size='2' weight={isActive ? 'medium' : 'normal'}>
          {renderDate(revision.date)}
        </Text>
        <Flex gap='2' align='center'>
          {counts.breaking > 0 && (
            <Text size='1' weight='medium' className='text-red-500'>
              {counts.breaking}
            </Text>
          )}
          {counts.dangerous > 0 && (
            <Text size='1' weight='medium' className='text-amber-500'>
              {counts.dangerous}
            </Text>
          )}
          {counts.safe > 0 && (
            <Text size='1' weight='medium' className='text-emerald-500'>
              {counts.safe}
            </Text>
          )}
        </Flex>
      </a>
    </Box>
  )
}

export const calculateCounts = (revision: Revision) => {
  return {
    breaking: revision.changes.filter(Change.isBreaking).length,
    dangerous: revision.changes.filter(Change.isDangerous).length,
    safe: revision.changes.filter(Change.isSafe).length,
  }
}
