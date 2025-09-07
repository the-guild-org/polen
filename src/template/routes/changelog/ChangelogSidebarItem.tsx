import { Change } from '#lib/change'
import { Revision } from '#lib/revision'
import { Box, Flex, Text } from '@radix-ui/themes'
import { renderDate } from './utils.js'

export const ChangelogSidebarItem: React.FC<{
  revision: Revision.Revision
  isActive: boolean
}> = ({ revision, isActive }) => {
  const counts = calculateCounts(revision)

  return (
    <Box mb='2'>
      <a
        href={`#${revision.date}`}
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem',
          borderRadius: '4px',
          backgroundColor: isActive ? 'var(--gray-a3)' : 'transparent',
          color: 'inherit',
          transition: 'background-color 0.2s',
        }}
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
        <Text size='2' weight={isActive ? 'medium' : 'regular'}>
          {renderDate(revision.date)}
        </Text>
        <Flex gap='2' align='center'>
          {counts.breaking > 0 && (
            <Text size='1' weight='medium' style={{ color: '#ef4444' }}>
              {counts.breaking}
            </Text>
          )}
          {counts.dangerous > 0 && (
            <Text size='1' weight='medium' style={{ color: '#f59e0b' }}>
              {counts.dangerous}
            </Text>
          )}
          {counts.safe > 0 && (
            <Text size='1' weight='medium' style={{ color: '#10b981' }}>
              {counts.safe}
            </Text>
          )}
        </Flex>
      </a>
    </Box>
  )
}

export const calculateCounts = (revision: Revision.Revision) => {
  return {
    breaking: revision.changes.filter(Change.isBreaking).length,
    dangerous: revision.changes.filter(Change.isDangerous).length,
    safe: revision.changes.filter(Change.isSafe).length,
  }
}
