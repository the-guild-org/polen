import { Catalog } from '#lib/catalog/$'
import { Swiss } from '#lib/swiss/$'
import { Version } from '#lib/version'
import { Box, Text } from '@radix-ui/themes'
import { HashMap, Option } from 'effect'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { VersionPicker } from '../../components/VersionPicker.js'
import { ChangelogSidebarItem } from './ChangelogSidebarItem.js'

export const ChangelogSidebar: React.FC<{
  catalog: Catalog.Catalog
}> = ({ catalog }) => {
  {
    const params = useParams()
    const navigate = useNavigate()
    const urlVersion = params['version'] ? Option.some(Version.decodeSync(params['version'])) : Option.none()

    // Get revisions for the current version (for sidebar)
    const revisions = Catalog.Unversioned.is(catalog)
      ? catalog.schema.revisions
      : Option.getOrThrow(HashMap.get(catalog.entries, Option.getOrThrow(urlVersion))).revisions

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
        {Catalog.Versioned.is(catalog) && (
          <Box mb='3'>
            <VersionPicker
              versions={Catalog.Versioned.getVersions(catalog)}
              currentVersion={Option.getOrThrow(urlVersion)}
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
