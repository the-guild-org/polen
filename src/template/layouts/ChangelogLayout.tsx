import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { Revision } from '#lib/revision/$'
import { Version } from '#lib/version/$'
import { Box, Flex, Text } from '@radix-ui/themes'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { renderDate } from '../components/Changelog/Changelog.js'
import { ChangelogVersionPicker } from '../components/Changelog/ChangelogVersionPicker.js'

interface ChangelogLayoutProps {
  children: React.ReactNode
  catalog: Catalog.Catalog
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
          // Update URL hash
          window.history.pushState(null, '', `#${dateId}`)
          // Dispatch custom event for pushState
          window.dispatchEvent(new Event('pushstate'))
          // Smooth scroll to element
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

export const ChangelogLayout: React.FC<ChangelogLayoutProps> = ({ children, catalog }) => {
  const [activeRevision, setActiveRevision] = useState<string | null>(null)
  const params = useParams()
  const urlVersion = params['version']

  // Get available versions if catalog is versioned
  const availableVersions = useMemo(() => {
    if (Catalog.Versioned.is(catalog)) {
      return catalog.entries.map(entry => Version.toString(entry.version))
    }
    return []
  }, [catalog])

  // Get revisions for the current version (for sidebar)
  const revisions = useMemo(() => {
    if (Catalog.Unversioned.is(catalog)) {
      return catalog.schema.revisions
    } else {
      // For versioned catalogs, show only current version's revisions
      if (urlVersion) {
        const entry = catalog.entries.find(e => Version.toString(e.version) === urlVersion)
        return entry ? entry.revisions : []
      }
      // No revisions if no version selected (will redirect)
      return []
    }
  }, [catalog, urlVersion])

  // Calculate counts for all revisions (SSR-safe)
  const revisionsWithCounts = revisions.map(revision => ({
    revision,
    counts: calculateCounts(revision),
  }))

  // Track active revision based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      setActiveRevision(hash || null)
    }

    // Set initial active revision
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    // Listen for pushState/replaceState (custom event we'll dispatch)
    window.addEventListener('pushstate', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('pushstate', handleHashChange)
    }
  }, [])

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
        {/* Version picker for versioned catalogs */}
        {Catalog.Versioned.is(catalog) && availableVersions.length > 1 && urlVersion && (
          <Box mb='3'>
            <ChangelogVersionPicker
              versions={availableVersions}
              currentVersion={urlVersion}
            />
          </Box>
        )}

        <Text size='2' weight='medium' mb='3' style={{ display: 'block' }}>
          Revisions
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
