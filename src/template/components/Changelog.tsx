import { GraphqlChange } from '#lib/graphql-change'
import { CRITICALITY_LEVELS } from '#lib/graphql-change/criticality'
import { GraphqlChangeset } from '#lib/graphql-changeset'
import type { CriticalityLevel } from '@graphql-inspector/core'
import { Box } from '@radix-ui/themes'
import React from 'react'
import { useMemo } from 'react'
import { CriticalitySection } from './Changelog/CriticalitySection.js'
import * as Group from './Changelog/groups/index.js'
import { ComponentDispatch } from './ComponentDispatch.js'

export const renderDate = (date: Date) => {
  return date.toLocaleString(`default`, {
    month: `long`,
    year: `numeric`,
    day: `numeric`,
    timeZone: `utc`,
  })
}

export const Changelog: React.FC<{ changesets: GraphqlChangeset.Changelog }> = ({ changesets }) => {
  return (
    <Box>
      {changesets.map(changeset => <Changeset key={changeset.date.toISOString()} changeset={changeset} />)}
    </Box>
  )
}

const Changeset: React.FC<{ changeset: GraphqlChangeset.ChangeSet }> = ({ changeset }) => {
  // Group changes by criticality level
  const groupedChanges = useMemo(() => {
    const groups = {} as Record<CriticalityLevel, GraphqlChange.Change[]>

    // Initialize empty arrays for each level
    CRITICALITY_LEVELS.forEach(level => {
      groups[level] = []
    })

    // Group changes
    if (GraphqlChangeset.isIntermediateChangeSet(changeset)) {
      changeset.changes.forEach(change => {
        const level = change.criticality.level
        if (groups[level]) {
          groups[level].push(change)
        }
      })
    }

    // Return only non-empty groups in order
    return CRITICALITY_LEVELS
      .filter(level => groups[level].length > 0)
      .map(level => ({
        level,
        changes: groups[level],
      }))
  }, [changeset])

  return (
    <Box mb='6'>
      <h1 title={changeset.date.toISOString()} id={changeset.date.toISOString()}>
        {renderDate(changeset.date)}
      </h1>
      {groupedChanges.map(group => (
        <CriticalitySection key={group.level} level={group.level} changes={group.changes}>
          {group.changes.map((change, index) => {
            const type = GraphqlChange.Group.getType(change)
            return (
              <ComponentDispatch
                key={`${change.type}-${change.path || change.message}-${index}`}
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
