// TODO: Review and replace inline styles with Tailwind classes
import * as React from 'react'
import { Link } from 'react-router'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { Badge, Box, Card, Container, Flex, Heading, Text } from '../ui/index.js'

import { Catalog } from 'graphql-kit'

interface RecentChangesProps {
  limit?: number
  showVersions?: boolean
}

export const RecentChangesSection: React.FC<RecentChangesProps> = ({
  limit = 5,
  showVersions = true,
}) => {
  // Get recent changes from catalog
  const getRecentChanges = () => {
    if (!schemasCatalog) return []

    // For unversioned catalogs, we look at revisions
    if (schemasCatalog._tag === 'CatalogUnversioned') {
      const revisions = schemasCatalog.schema.revisions || []
      const recentRevisions = revisions.slice(0, limit)

      return recentRevisions.map((revision: any) => ({
        date: revision.date,
        changes: revision.changes || [],
        version: null as string | null,
      }))
    }

    // For versioned catalogs, we look at entries
    if (schemasCatalog._tag === 'CatalogVersioned') {
      const entries = Catalog.Versioned.getAll(schemasCatalog)
      const recentEntries = entries.slice(0, limit)

      return recentEntries.flatMap(entry =>
        entry.revisions.map(revision => ({
          date: revision.date,
          changes: revision.changes || [],
          version: typeof entry.version === 'object' && 'value' in entry.version
            ? String(entry.version.value)
            : typeof entry.version === 'string'
            ? entry.version
            : null,
        }))
      ).slice(0, limit)
    }

    return []
  }

  const recentChanges = getRecentChanges()

  if (recentChanges.length === 0) {
    return null
  }

  const getCriticalityColor = (level: string) => {
    switch (level) {
      case 'BREAKING':
        return 'red'
      case 'DANGEROUS':
        return 'orange'
      case 'NON_BREAKING':
      default:
        return 'green'
    }
  }

  return (
    <Container size='lg'>
      <Box style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Flex justify='between' align='center' mb='4'>
          <Box>
            <Heading size='6' mb='2'>
              Recent Changes
            </Heading>
            <Text size='3' color='gray'>
              Latest updates to the GraphQL schema
            </Text>
          </Box>

          <Button variant='soft' asChild>
            <Link to='/changelog'>View Full Changelog</Link>
          </Button>
        </Flex>

        <Flex direction='column' gap='3'>
          {recentChanges.map((revision: any, index: number) => (
            <Card key={index} size='2'>
              <Flex justify='between' align='start' mb='3'>
                <Box>
                  <Text size='2' color='gray'>
                    {new Date(revision.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  {showVersions && revision.version && (
                    <Badge size='1' variant='soft' ml='2'>
                      v{revision.version}
                    </Badge>
                  )}
                </Box>

                <Text size='1' color='gray'>
                  {revision.changes.length} change{revision.changes.length !== 1 ? 's' : ''}
                </Text>
              </Flex>

              <Flex direction='column' gap='2'>
                {revision.changes.slice(0, 3).map((change: any, changeIndex: number) => (
                  <Flex key={changeIndex} align='center' gap='2'>
                    <Badge
                      size='1'
                      color={getCriticalityColor(change.criticality?.level || 'NON_BREAKING')}
                    >
                      {change._tag.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    <Text size='2' style={{ flex: 1 }}>
                      {change.message}
                    </Text>
                  </Flex>
                ))}

                {revision.changes.length > 3 && (
                  <Text size='1' color='gray' mt='1'>
                    ...and {revision.changes.length - 3} more changes
                  </Text>
                )}
              </Flex>
            </Card>
          ))}
        </Flex>

        {recentChanges.length >= limit && (
          <Box mt='4' style={{ textAlign: 'center' }}>
            <Button variant='ghost' asChild>
              <Link to='/changelog'>
                View all changes →
              </Link>
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  )
}

// Add missing Button import (Radix Themes doesn't export Button, we'll use a simple link)
import { Button } from '../ui/index.js'
