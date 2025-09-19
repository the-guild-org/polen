// TODO: Review and replace inline styles with Tailwind classes
import { Catalog, Schema, Version } from 'graphql-kit'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Box, GridItem, Text } from '../../components/ui/index.js'
import { VersionPicker } from '../../components/VersionPicker.js'
import { ChangelogSidebarItem } from './ChangelogSidebarItem.js'

export const ChangelogSidebar: React.FC<{
  catalog: Catalog.Catalog
  schema: Schema.Schema
}> = ({ catalog, schema }) => {
  {
    const navigate = useNavigate()

    // todo: reverse at input source processes
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
      <GridItem
        cols={3}
        className='sticky top-8 h-fit min-w-[250px] max-h-[calc(100vh-4rem)] overflow-y-auto'
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
        <Text size='2' weight='medium' mb='3' className='block'>
          Revisions
        </Text>
        {revisions.map((revision) => (
          <ChangelogSidebarItem
            key={revision.date}
            revision={revision}
            isActive={activeRevision === revision.date}
          />
        ))}
      </GridItem>
    )
  }
}
