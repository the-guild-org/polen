import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { DateOnly } from '#lib/date-only/$'
import { Revision } from '#lib/revision/$'
import { Schema } from '#lib/schema/$'
import { Version } from '#lib/version/$'
const CRITICALITY_LEVELS = ['BREAKING', 'DANGEROUS', 'NON_BREAKING'] as const
import type { CriticalityLevel } from '@graphql-inspector/core'
import { Box, Heading } from '@radix-ui/themes'
import React, { useEffect } from 'react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ComponentDispatch } from '../ComponentDispatch.js'
import { CriticalitySection } from './CriticalitySection.js'
import * as Group from './groups/index.js'

export const renderDate = (dateOnly: DateOnly.DateOnly) => {
  const date = DateOnly.toDate(dateOnly)
  const year = date.getUTCFullYear()
  return `${year} ${
    date.toLocaleString('default', {
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }`
}

export const Changelog: React.FC<{ catalog: Catalog.Catalog }> = ({ catalog }) => {
  const params = useParams()
  const navigate = useNavigate()
  const urlVersion = params['version']

  // Redirect to latest version if versioned catalog and no version specified
  useEffect(() => {
    if (urlVersion) return
    if (Catalog.Unversioned.is(catalog)) return
    const latestSchema = catalog.entries[0]
    if (!latestSchema) return
    const latestVersion = Version.encodeSync(latestSchema.version)
    navigate(`/changelog/version/${latestVersion}`, { replace: true })
  }, [catalog, urlVersion, navigate])

  // Get revisions and corresponding schema based on catalog type and URL params
  const { revisions, schema } = useMemo(() => {
    if (Catalog.Unversioned.is(catalog)) {
      return {
        revisions: catalog.schema.revisions,
        schema: catalog.schema,
      }
    } else {
      // For versioned catalogs, always show specific version (never all)
      if (urlVersion) {
        const entry = catalog.entries.find(e => Version.encodeSync(e.version) === urlVersion)
        return entry
          ? { revisions: entry.revisions, schema: entry }
          : { revisions: [], schema: null }
      }
      // This shouldn't happen due to redirect above, but return empty as fallback
      return { revisions: [], schema: null }
    }
  }, [catalog, urlVersion])

  // Don't render anything while redirecting
  if (Catalog.Versioned.is(catalog) && !urlVersion) {
    return null
  }

  return (
    <Box>
      {/* Title bar - always shown */}
      <Heading size='5' style={{ padding: '1rem 0', borderBottom: '1px solid var(--gray-4)', marginBottom: '1.5rem' }}>
        Changelog
      </Heading>

      {revisions.map(revision => <Changeset key={revision.date} revision={revision} schema={schema} />)}
    </Box>
  )
}

const Changeset: React.FC<{ revision: Revision.Revision; schema: Schema.Schema | null }> = ({ revision, schema }) => {
  // Group changes by criticality level
  const groupedChanges = useMemo(() => {
    const groups = {} as Record<CriticalityLevel, Change.Change[]>

    // Initialize empty arrays for each level
    CRITICALITY_LEVELS.forEach(level => {
      groups[level] = []
    })

    // Group changes - revisions always have changes array
    revision.changes.forEach(change => {
      const level = change.criticality.level
      if (groups[level]) {
        groups[level].push(change)
      }
    })

    // Return only non-empty groups in order
    return CRITICALITY_LEVELS
      .filter(level => groups[level].length > 0)
      .map(level => ({
        level,
        changes: groups[level],
      }))
  }, [revision])

  return (
    <Box mb='6' id={revision.date} style={{ scrollMarginTop: '2rem' }}>
      <h1>
        <a
          href={`#${revision.date}`}
          style={{
            color: 'inherit',
            textDecoration: 'none',
            position: 'relative',
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
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none'
          }}
        >
          {renderDate(revision.date)}
        </a>
      </h1>
      {groupedChanges.map(group => (
        <CriticalitySection key={group.level} level={group.level} changes={group.changes}>
          {group.changes.map((change, index) => {
            const type = Change.getType(change)
            return (
              <ComponentDispatch
                key={`${change._tag}-${change.path || change.message}-${index}`}
                components={Group}
                name={type}
                props={{ change, schema }}
              />
            )
          })}
        </CriticalitySection>
      ))}
    </Box>
  )
}
