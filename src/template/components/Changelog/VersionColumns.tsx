import { Change } from '#lib/change/$'
import { Revision } from '#lib/revision/$'
import { Badge, Box, Card, Flex, Heading, Text } from '@radix-ui/themes'
import React from 'react'
import { renderDate } from '../Changelog.js'
import { CriticalitySection } from './CriticalitySection.js'
import * as Group from './groups/index.js'
import { ComponentDispatch } from '../ComponentDispatch.js'

const CRITICALITY_LEVELS = ['BREAKING', 'DANGEROUS', 'NON_BREAKING'] as const
import type { CriticalityLevel } from '@graphql-inspector/core'

interface VersionColumnsProps {
  entries: Array<{
    schema: any
    parent: any | null
    revisions: Revision.Revision[]
  }>
  currentRevision?: string | undefined
}

export const VersionColumns: React.FC<VersionColumnsProps> = ({
  entries,
  currentRevision,
}) => {
  // Get version from schema
  const getVersion = (entry: any) => {
    // Check if entry has a schema with a version
    if (entry?.schema?.version) {
      const version = entry.schema.version
      console.log('Version from entry:', version, 'Type:', typeof version)
      // Version might be an object with value property (from Effect Schema)
      const result = typeof version === 'object' && version.value 
        ? version.value 
        : version
      console.log('Extracted version:', result)
      return result || 'unknown'
    }
    return 'main'
  }
  
  // Sort entries by version (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    const versionA = getVersion(a)
    const versionB = getVersion(b)
    // Simple string comparison, could be enhanced with semantic versioning
    return versionB.localeCompare(versionA)
  })
  
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${entries.length}, minmax(300px, 1fr))`,
        gap: '2rem',
        width: '100%',
        overflowX: 'auto',
      }}
    >
      {sortedEntries.map(entry => {
        const version = getVersion(entry)
        const sortedRevisions = [...entry.revisions].sort((a, b) => 
          b.date.localeCompare(a.date)
        )
        
        return (
          <Box key={version} style={{ minWidth: '300px' }}>
            {/* Sticky version header */}
            <Box
              style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--color-background)',
                zIndex: 10,
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--gray-4)',
                marginBottom: '1rem',
              }}
            >
              <Flex align="center" gap="2">
                <Heading size="5">Version {version}</Heading>
                {entry.parent && (
                  <Badge color="gray" variant="soft" size="1">
                    from v{typeof entry.parent.version === 'object' 
                      ? entry.parent.version.value 
                      : entry.parent.version || 'unknown'}
                    {entry.parent.revisions && entry.parent.revisions.length > 0 && (
                      <> @ {entry.parent.revisions[0].date}</>
                    )}
                  </Badge>
                )}
              </Flex>
            </Box>
            
            {/* Revisions */}
            <Box>
              {sortedRevisions.length === 0 ? (
                <Text color="gray" size="2">No revisions</Text>
              ) : (
                sortedRevisions.map(revision => (
                  <RevisionCard
                    key={revision.date}
                    revision={revision}
                    version={version}
                    isActive={currentRevision === `${version}-${revision.date}`}
                  />
                ))
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

interface RevisionCardProps {
  revision: Revision.Revision
  version: string
  isActive?: boolean
}

const RevisionCard: React.FC<RevisionCardProps> = ({ 
  revision, 
  version,
  isActive 
}) => {
  // Group changes by criticality
  const groupedChanges = React.useMemo(() => {
    const groups = {} as Record<CriticalityLevel, Change.Change[]>
    
    CRITICALITY_LEVELS.forEach(level => {
      groups[level] = []
    })
    
    revision.changes.forEach(change => {
      const level = change.criticality.level
      if (groups[level]) {
        groups[level].push(change)
      }
    })
    
    return CRITICALITY_LEVELS
      .filter(level => groups[level].length > 0)
      .map(level => ({
        level,
        changes: groups[level],
      }))
  }, [revision])
  
  return (
    <Card
      id={`${version}-${revision.date}`}
      style={{
        marginBottom: '1.5rem',
        scrollMarginTop: '100px',
        border: isActive ? '2px solid var(--accent-9)' : undefined,
      }}
    >
      <Box mb="3">
        <Flex justify="between" align="center">
          <Text size="3" weight="bold">
            {renderDate(revision.date)}
          </Text>
          <Badge color="gray" variant="soft" size="1">
            {revision.changes.length} change{revision.changes.length !== 1 ? 's' : ''}
          </Badge>
        </Flex>
      </Box>
      
      {groupedChanges.length === 0 ? (
        <Text size="2" color="gray">No changes in this revision</Text>
      ) : (
        groupedChanges.map(group => (
          <CriticalitySection 
            key={group.level} 
            level={group.level} 
            changes={group.changes}
          >
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
        ))
      )}
    </Card>
  )
}