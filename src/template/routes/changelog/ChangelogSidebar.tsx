import { Catalog } from '#lib/catalog/$'
import { Schema } from '#lib/schema/$'
import { Swiss } from '#lib/swiss/$'
import { Version } from '#lib/version'
import { Box, Text } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { VersionPicker } from '../../components/VersionPicker.js'
import { ChangelogSidebarItem } from './ChangelogSidebarItem.js'

export const ChangelogSidebar: React.FC<{
  catalog: Catalog.Catalog
  schema: Schema.Schema
}> = ({ catalog, schema }) => {
  {
    const navigate = useNavigate()

    // Get revisions for the current version (for sidebar)
    const revisions = schema.revisions

    const [activeRevision, setActiveRevision] = useState<string | null>(null)
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
      <Swiss.Item
        cols={3}
        style={{
          position: 'sticky',
          top: '2rem',
          height: 'fit-content',
          minWidth: '250px',
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto',
        }}
      >
        {Catalog.Versioned.is(catalog) && Schema.Versioned.is(schema) && (
          <Box mb='3'>
            <VersionPicker
              versions={Catalog.Versioned.getVersions(catalog)}
              currentVersion={schema.version}
              onVersionChange={(newVersion) => {
                navigate(`/changelog/version/${Version.encodeSync(newVersion)}`)
              }}
            />
          </Box>
        )}
        <Text size='2' weight='medium' mb='3' style={{ display: 'block' }}>
          Revisions
        </Text>
        {revisions.map((revision) => (
          <ChangelogSidebarItem
            key={revision.date}
            revision={revision}
            isActive={activeRevision === revision.date}
          />
        ))}
      </Swiss.Item>
    )
  }
}
