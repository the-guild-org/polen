import { Catalog } from '#lib/catalog'
import { Change } from '#lib/change'
import { route } from '#lib/react-router-effect/route'
import { useLoaderData } from '#lib/react-router-effect/use-loader-data'
import { Revision } from '#lib/revision'
import { Swiss } from '#lib/swiss'
import { Version } from '#lib/version'
import { Box, Flex, Text } from '@radix-ui/themes'
import { Effect } from 'effect'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { Changelog } from '../components/Changelog/Changelog.js'
import { renderDate } from '../components/Changelog/Changelog.js'
import { ChangelogVersionPicker } from '../components/Changelog/ChangelogVersionPicker.js'

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

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Schema
//
//

const schema = Catalog.Catalog

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Loader
//
//

const changelogLoader = () => {
  // This should never be called when schemasCatalog is null
  // because the route won't be added to the router
  // But we return an Effect.fail for safety
  if (!schemasCatalog) {
    return Effect.fail(
      new Error(
        'No schema catalog available. This page requires a GraphQL schema to be configured. '
          + 'Please ensure your Polen configuration includes a valid schema source.',
      ),
    )
  }
  return Effect.succeed(schemasCatalog)
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Component
//
//

const Component = () => {
  const catalog = useLoaderData(schema)

  const [activeRevision, setActiveRevision] = useState<string | null>(null)
  const params = useParams()
  const urlVersion = params['version']

  // Get available versions if catalog is versioned
  const availableVersions = useMemo(() => {
    if (Catalog.Versioned.is(catalog)) {
      return catalog.entries.map(entry => Version.encodeSync(entry.version))
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
        const entry = catalog.entries.find(e => Version.encodeSync(e.version) === urlVersion)
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
    <Swiss.Body subgrid>
      {/* Sidebar */}
      <Swiss.Item
        cols={4}
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
      </Swiss.Item>

      {/* Main content */}
      <Swiss.Item start={6} cols={7}>
        <Changelog catalog={catalog} />
      </Swiss.Item>
    </Swiss.Body>
  )
}

//
//
//
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ • Routes
//
//

export const changelog = !schemasCatalog
  ? null
  : route({
    schema,
    path: `changelog`,
    loader: changelogLoader,
    Component,
    children: [
      // Support deep linking to specific version
      route({
        path: `version/:version`,
        loader: changelogLoader,
        Component,
      }),
      // Support deep linking to specific version/revision
      route({
        path: `version/:version/revision/:revision`,
        loader: changelogLoader,
        Component,
      }),
    ],
  })
