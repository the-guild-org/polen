import { Catalog } from '#lib/catalog/$'
import { Change } from '#lib/change/$'
import { Revision } from '#lib/revision/$'
import { Version } from '#lib/version/$'
import { Badge, Box, Button, Card, Flex, Text } from '@radix-ui/themes'
import { Match } from 'effect'
import React from 'react'
import { useNavigate, useParams } from 'react-router'
import type { LayoutMode } from '../CatalogRailway/helpers.js'
import { renderDate } from '../Changelog.js'
import { ComponentDispatch } from '../ComponentDispatch.js'
import { CriticalitySection } from './CriticalitySection.js'
import * as Group from './groups/index.js'
import { NavigationToolbar } from './NavigationToolbar.js'

const CRITICALITY_LEVELS = ['BREAKING', 'DANGEROUS', 'NON_BREAKING'] as const
import type { CriticalityLevel } from '@graphql-inspector/core'

interface VersionColumnsProps {
  catalog: Catalog.Catalog
  currentRevision?: string | undefined
  layoutMode?: LayoutMode
  onLayoutModeChange?: (mode: LayoutMode) => void
}

export const VersionColumns: React.FC<VersionColumnsProps> = ({
  catalog,
  currentRevision,
  layoutMode = 'uniform',
  onLayoutModeChange,
}) => {
  const navigate = useNavigate()
  const params = useParams()
  const [isWiggling, setIsWiggling] = React.useState(false)

  // Get version and revision from URL params
  const urlVersion = params['version']
  const urlRevision = params['revision']

  // Scroll to active revision card when URL changes
  // React.useEffect(() => {
  //   if (urlVersion && urlRevision) {
  //     // Double RAF to ensure layout is settled
  //     requestAnimationFrame(() => {
  //       requestAnimationFrame(() => {
  //         const elementId = `${urlVersion}-${urlRevision}`
  //         const element = document.getElementById(elementId)

  //         if (element) {
  //           const rect = element.getBoundingClientRect()
  //           const viewportHeight = window.innerHeight
  //           const buffer = 100

  //           // Check if we need to scroll at all
  //           const needsScroll = rect.top < buffer || rect.bottom > viewportHeight

  //           if (needsScroll) {
  //             // Use native scrollIntoView with proper options
  //             element.scrollIntoView({
  //               behavior: 'auto',
  //               block: rect.height < viewportHeight - buffer ? 'center' : 'start',
  //             })
  //           }
  //         }
  //       })
  //     })
  //   }
  // }, [urlVersion, urlRevision])

  // Extract entries from catalog
  const entries = React.useMemo(() => {
    return Match.value(catalog).pipe(
      Match.tag('CatalogVersioned', (c) => {
        return c.entries.map(versionedSchema => ({
          schema: versionedSchema,
          branchPoint: versionedSchema.branchPoint,
          revisions: versionedSchema.revisions,
        }))
      }),
      Match.tag('CatalogUnversioned', (c) => [{
        schema: c.schema,
        branchPoint: null,
        revisions: c.schema.revisions,
      }]),
      Match.exhaustive,
    )
  }, [catalog])

  // Get version string from schema
  const getVersion = (entry: typeof entries[0]) => {
    return Catalog.getSchemaVersionString(entry.schema)
  }

  // Sort entries by version (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    // Handle unversioned schemas (they don't have .version)
    if ('version' in a.schema && 'version' in b.schema) {
      return Version.order(b.schema.version, a.schema.version)
    }
    // If either is unversioned, keep original order
    return 0
  })

  // Find current version index from URL or default to 0
  const currentVersionIndex = React.useMemo(() => {
    if (!urlVersion) return 0
    const index = sortedEntries.findIndex(entry => getVersion(entry) === urlVersion)
    return index >= 0 ? index : 0
  }, [urlVersion, sortedEntries])

  // Find current revision index within the version
  const currentRevisionIndex = React.useMemo(() => {
    if (!urlRevision) return 0
    const currentEntry = sortedEntries[currentVersionIndex]
    if (!currentEntry) return 0
    const sortedRevisions = [...currentEntry.revisions].sort(Revision.order)
    const index = sortedRevisions.findIndex(rev => rev.date === urlRevision)
    return index >= 0 ? index : 0
  }, [urlRevision, currentVersionIndex, sortedEntries])

  // Navigation functions
  const navigateToVersion = (index: number) => {
    const entry = sortedEntries[index]
    if (entry) {
      const versionString = getVersion(entry)
      navigate(`/changelog/version/${versionString}`)
    }
  }

  const navigateToPrevious = () => {
    if (currentVersionIndex > 0) {
      navigateToVersion(currentVersionIndex - 1)
    }
  }

  const navigateToNext = () => {
    if (currentVersionIndex < sortedEntries.length - 1) {
      navigateToVersion(currentVersionIndex + 1)
    }
  }

  // Revision navigation functions
  const navigateToRevision = (versionIndex: number, revisionIndex: number) => {
    const entry = sortedEntries[versionIndex]
    if (entry) {
      const sortedRevisions = [...entry.revisions].sort(Revision.order)
      const revision = sortedRevisions[revisionIndex]
      if (revision) {
        const versionString = getVersion(entry)
        navigate(`/changelog/version/${versionString}/revision/${revision.date}`)
      }
    }
  }

  const navigateToPreviousRevision = () => {
    const currentEntry = sortedEntries[currentVersionIndex]
    if (!currentEntry) return
    if (currentRevisionIndex > 0) {
      navigateToRevision(currentVersionIndex, currentRevisionIndex - 1)
    }
  }

  const navigateToNextRevision = () => {
    const currentEntry = sortedEntries[currentVersionIndex]
    if (!currentEntry) return
    const sortedRevisions = [...currentEntry.revisions].sort(Revision.order)
    if (currentRevisionIndex < sortedRevisions.length - 1) {
      navigateToRevision(currentVersionIndex, currentRevisionIndex + 1)
    }
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Always prevent default for arrow keys in changelog
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
      }

      // Left/Right for version navigation
      if (event.key === 'ArrowLeft' && currentVersionIndex > 0) {
        navigateToPrevious() // Go to newer version
      } else if (event.key === 'ArrowRight' && currentVersionIndex < sortedEntries.length - 1) {
        navigateToNext() // Go to older version
      } // Up/Down for revision navigation within current version
      else if (event.key === 'ArrowUp') {
        if (!urlRevision) {
          // No revision in URL - trigger wiggle animation
          setIsWiggling(true)
          setTimeout(() => setIsWiggling(false), 300)
          return
        }
        if (currentRevisionIndex > 0) {
          navigateToPreviousRevision() // Go to newer revision
        } else {
          // At first revision - go back to version-only URL
          const versionString = getVersion(sortedEntries[currentVersionIndex]!)
          navigate(`/changelog/version/${versionString}`)
        }
      } else if (event.key === 'ArrowDown') {
        const currentEntry = sortedEntries[currentVersionIndex]
        if (!currentEntry || !currentEntry.revisions.length) return

        if (!urlRevision) {
          // No revision in URL - down goes to FIRST revision
          const sortedRevisions = [...currentEntry.revisions].sort(Revision.order)
          const firstRevision = sortedRevisions[0]
          if (firstRevision) {
            const versionString = getVersion(currentEntry)
            navigate(`/changelog/version/${versionString}/revision/${firstRevision.date}`)
          }
        } else if (currentRevisionIndex < currentEntry.revisions.length - 1) {
          navigateToNextRevision() // Go to older revision
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    currentVersionIndex,
    currentRevisionIndex,
    sortedEntries.length,
    navigateToPrevious,
    navigateToNext,
    navigateToPreviousRevision,
    navigateToNextRevision,
  ])

  // Get current entry to display
  const currentEntry = sortedEntries[currentVersionIndex]

  if (!currentEntry) {
    return <Text>No versions available</Text>
  }

  const currentVersionString = getVersion(currentEntry)

  return (
    <Box style={{ width: '100%', maxWidth: '800px' }}>
      {/* Navigation Toolbar with version title */}
      <NavigationToolbar
        currentIndex={currentVersionIndex}
        totalCount={sortedEntries.length}
        currentVersion={currentVersionString}
        onPrevious={navigateToPrevious}
        onNext={navigateToNext}
        canNavigatePrevious={currentVersionIndex > 0}
        canNavigateNext={currentVersionIndex < sortedEntries.length - 1}
        isWiggling={isWiggling}
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
      />

      {/* Single Version Content */}
      <Box>
        {/* Revisions */}
        <Box>
          {(() => {
            const sortedRevisions = [...currentEntry.revisions].sort(Revision.order)
            return sortedRevisions.length === 0 ? <Text color='gray' size='2'>No revisions</Text> : (
              <>
                {sortedRevisions.map(revision => (
                  <RevisionCard
                    key={revision.date}
                    revision={revision}
                    version={currentVersionString}
                    isActive={urlRevision === revision.date}
                  />
                ))}

                {/* Branch info or initial version info at end of revisions */}
                <Flex justify='center' mt='3'>
                  {currentEntry.branchPoint
                    ? (
                      <Button
                        variant='soft'
                        size='2'
                        color='gray'
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const branchVersion = Version.toString(currentEntry.branchPoint!.schema.version)
                          const branchRevision = currentEntry.branchPoint!.revision.date
                          navigate(`/changelog/version/${branchVersion}/revision/${branchRevision}`)
                        }}
                      >
                        branched from version {Version.toString(currentEntry.branchPoint.schema.version)} at{' '}
                        {renderDate(currentEntry.branchPoint.revision.date)}
                      </Button>
                    )
                    : (
                      <Badge variant='soft' size='2' color='blue'>
                        initial version
                      </Badge>
                    )}
                </Flex>
              </>
            )
          })()}
        </Box>
      </Box>
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
  isActive,
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
        outline: isActive ? '2px solid var(--accent-9)' : 'none',
        outlineOffset: '-2px',
      }}
    >
      <Box mb='3'>
        <Flex justify='between' align='center'>
          <Text size='3' weight='bold'>
            {renderDate(revision.date)}
          </Text>
          <Badge color='gray' variant='soft' size='1'>
            {revision.changes.length} change{revision.changes.length !== 1 ? 's' : ''}
          </Badge>
        </Flex>
      </Box>

      {groupedChanges.length === 0 ? <Text size='2' color='gray'>No changes in this revision</Text> : (
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
