import { Change } from '#lib/change/$'
import { Revision } from '#lib/revision/$'
import { Box, Flex, Text } from '@radix-ui/themes'
import type React from 'react'
import { useEffect, useState } from 'react'
import { renderDate } from '../components/Changelog.js'

interface ChangelogLayoutProps {
  children: React.ReactNode
  revisions: Revision.Revision[]
}

interface VersionCounts {
  breaking: number
  dangerous: number
  safe: number
}

const calculateCounts = (revision: Revision.Revision): VersionCounts => {
  return {
    breaking: revision.changes.filter(Change.isBreaking).length,
    dangerous: revision.changes.filter(Change.isDangerous).length,
    safe: revision.changes.filter(Change.isSafe).length,
  }
}

const SidebarEntry: React.FC<{
  revision: Revision.Revision
  counts: VersionCounts
  isActive: boolean
}> = ({ revision, counts, isActive }) => {
  const dateId = revision.date

  return (
    <Box mb='2'>
      <a
        href={`#${dateId}`}
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
          document.getElementById(dateId)?.scrollIntoView({ behavior: 'smooth' })
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

export const ChangelogLayout: React.FC<ChangelogLayoutProps> = ({ children, revisions }) => {
  const [activeRevision, setActiveRevision] = useState<string | null>(null)

  // Calculate counts for all revisions (SSR-safe)
  const revisionsWithCounts = revisions.map(revision => ({
    revision,
    counts: calculateCounts(revision),
  }))

  // Set up scroll spy after hydration
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // Offset for header

      // Find the current revision based on scroll position
      let currentRevision: string | null = null

      for (const { revision } of revisionsWithCounts) {
        const element = document.getElementById(revision.date)
        if (element) {
          const { top } = element.getBoundingClientRect()
          if (top <= 100) {
            currentRevision = revision.date
          }
        }
      }

      setActiveRevision(currentRevision)
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [revisionsWithCounts])

  return (
    <Flex gap='6' style={{ position: 'relative' }}>
      {/* Sidebar */}
      <Box
        style={{
          position: 'sticky',
          top: '2rem',
          height: 'fit-content',
          minWidth: '250px',
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto',
        }}
      >
        <Text size='2' weight='medium' mb='3' style={{ display: 'block' }}>
          Releases
        </Text>
        {revisionsWithCounts.map(({ revision, counts }) => (
          <SidebarEntry
            key={revision.date}
            revision={revision}
            counts={counts}
            isActive={activeRevision === revision.date}
          />
        ))}
      </Box>

      {/* Main content */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Flex>
  )
}
