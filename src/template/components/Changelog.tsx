import { Change } from '#lib/change/$'
import { Revision } from '#lib/revision/$'

const CRITICALITY_LEVELS = ['BREAKING', 'DANGEROUS', 'NON_BREAKING'] as const
import type { CriticalityLevel } from '@graphql-inspector/core'
import { Box } from '@radix-ui/themes'
import React from 'react'
import { useMemo } from 'react'
import { CriticalitySection } from './Changelog/CriticalitySection.js'
import * as Group from './Changelog/groups/index.js'
import { ComponentDispatch } from './ComponentDispatch.js'

export const renderDate = (dateString: string) => {
  // DateOnly is in YYYY-MM-DD format
  const date = new Date(dateString + 'T00:00:00Z')
  return date.toLocaleString(`default`, {
    month: `long`,
    year: `numeric`,
    day: `numeric`,
    timeZone: `utc`,
  })
}

export const Changelog: React.FC<{ revisions: Revision.Revision[] }> = ({ revisions }) => {
  return (
    <Box>
      {revisions.map(revision => <Changeset key={revision.date} revision={revision} />)}
    </Box>
  )
}

const Changeset: React.FC<{ revision: Revision.Revision }> = ({ revision }) => {
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
    <Box mb='6'>
      <h1 title={revision.date} id={revision.date}>
        {renderDate(revision.date)}
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
                props={{ change }}
              />
            )
          })}
        </CriticalitySection>
      ))}
    </Box>
  )
}
