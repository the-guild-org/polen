// TODO: Review and replace inline styles with Tailwind classes
import { Change, Revision, Schema } from 'graphql-kit'
const CRITICALITY_LEVELS = ['BREAKING', 'DANGEROUS', 'NON_BREAKING'] as const
import type { CriticalityLevel } from '@graphql-inspector/core'
import React from 'react'
import { useMemo } from 'react'
import { CriticalitySection } from '../../components/Changelog/CriticalitySection.js'
import * as Group from '../../components/Changelog/groups/index.js'
import { ComponentDispatch } from '../../components/ComponentDispatch.js'
import { Box, Heading } from '../../components/ui/index.js'
import { renderDate } from './utils.js'

export const ChangelogBody: React.FC<{ schema: Schema.Schema }> = ({ schema }) => {
  return (
    <Box>
      {/* Title bar - always shown */}
      <Heading size='5' className='py-4 border-b border-gray-300 mb-6'>
        Changelog
      </Heading>

      {/*// todo: reverse at input source processes*/}
      {schema.revisions.map(revision => (
        <Changeset
          key={revision.date}
          revision={revision}
          schema={schema}
        />
      ))}
    </Box>
  )
}

const Changeset: React.FC<{ revision: Revision; schema: Schema.Schema | null }> = ({ revision, schema }) => {
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
    <Box mb='6' id={revision.date} className='scroll-mt-8'>
      <h1>
        <a
          href={`#${revision.date}`}
          className='text-inherit no-underline relative'
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
