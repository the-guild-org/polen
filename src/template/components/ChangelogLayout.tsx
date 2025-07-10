import {
  CRITICALITY_CONFIG,
  isCriticalityBreaking,
  isCriticalityDangerous,
  isCriticalitySafe,
} from '#lib/graphql-change/criticality'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import { Box, Flex, Text } from '@radix-ui/themes'
import type React from 'react'
import { useEffect, useState } from 'react'
import { renderDate } from './Changelog.js'

interface ChangelogLayoutProps {
  children: React.ReactNode
  versions: GraphqlChangeset.ChangeSet[]
}

interface VersionCounts {
  breaking: number
  dangerous: number
  safe: number
}

const calculateCounts = (version: GraphqlChangeset.ChangeSet): VersionCounts => {
  return {
    breaking: version.changes.filter(isCriticalityBreaking).length,
    dangerous: version.changes.filter(isCriticalityDangerous).length,
    safe: version.changes.filter(isCriticalitySafe).length,
  }
}

const SidebarEntry: React.FC<{
  version: GraphqlChangeset.ChangeSet
  counts: VersionCounts
  isActive: boolean
}> = ({ version, counts, isActive }) => {
  const dateId = version.date.toISOString()

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
          {renderDate(version.date)}
        </Text>
        <Flex gap='2' align='center'>
          {counts.breaking > 0 && (
            <Text size='1' weight='medium' style={{ color: CRITICALITY_CONFIG.BREAKING.color }}>
              {counts.breaking}
            </Text>
          )}
          {counts.dangerous > 0 && (
            <Text size='1' weight='medium' style={{ color: CRITICALITY_CONFIG.DANGEROUS.color }}>
              {counts.dangerous}
            </Text>
          )}
          {counts.safe > 0 && (
            <Text size='1' weight='medium' style={{ color: CRITICALITY_CONFIG.NON_BREAKING.color }}>
              {counts.safe}
            </Text>
          )}
        </Flex>
      </a>
    </Box>
  )
}

export const ChangelogLayout: React.FC<ChangelogLayoutProps> = ({ children, versions }) => {
  const [activeVersion, setActiveVersion] = useState<string | null>(null)

  // Calculate counts for all versions (SSR-safe)
  const versionsWithCounts = versions.map(version => ({
    version,
    counts: calculateCounts(version),
  }))

  // Set up scroll spy after hydration
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // Offset for header

      // Find the current version based on scroll position
      let currentVersion: string | null = null

      for (const { version } of versionsWithCounts) {
        const element = document.getElementById(version.date.toISOString())
        if (element) {
          const { top } = element.getBoundingClientRect()
          if (top <= 100) {
            currentVersion = version.date.toISOString()
          }
        }
      }

      setActiveVersion(currentVersion)
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [versionsWithCounts])

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
        {versionsWithCounts.map(({ version, counts }) => (
          <SidebarEntry
            key={version.date.toISOString()}
            version={version}
            counts={counts}
            isActive={activeVersion === version.date.toISOString()}
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
