import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { Version } from '#lib/version/$'
import { HashMap, Option } from 'effect'
import { useNavigate } from 'react-router'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { useReferencePath } from '../hooks/useReferencePath.js'
import { Stores } from '../stores/$.js'
import { tryWithToast } from '../utils/try-with-toast.js'
import { VersionPicker } from './VersionPicker.js'

interface Props {
  data: readonly Version.Version[]
  current: Version.Version
}

export const ReferenceVersionPicker: React.FC<Props> = ({ data, current }) => {
  const navigate = useNavigate()
  const currentPath = useReferencePath()

  const handleVersionChange = async (version: Version.Version) => {
    const newVersion = Version.encodeSync(version)
    const error = await tryWithToast(async () => {
      // Get the full catalog to find the target schema
      if (!schemasCatalog) {
        throw new Error('No catalog available')
      }
      const catalog = schemasCatalog

      // This component is only used for versioned catalogs
      if (catalog._tag !== 'CatalogVersioned') {
        throw new Error('VersionPicker used with non-versioned catalog')
      }

      // Find the schema for the target version
      // Note: newVersion is a string that we need to parse
      const targetSchemaOption = Option.map(
        HashMap.findFirst(catalog.entries, (_, key) => Version.encodeSync(key) === newVersion),
        ([, value]) => value,
      )

      if (Option.isNone(targetSchemaOption)) {
        throw new Error(`Version ${newVersion} not found`)
      }

      const targetSchema = Option.getOrThrow(targetSchemaOption)

      // Find fallback path if needed
      const fallbackPath = Api.Schema.Validation.findFallbackPath(targetSchema.definition, currentPath)
      // Get redirect description if path changed
      const redirectDescription = Api.Schema.Validation.getRedirectDescription(
        targetSchema.definition,
        currentPath,
        fallbackPath,
        newVersion,
      )
      // Create the new path - parse newVersion string to Version type
      const newPath = Api.Schema.Routing.createReferencePath({
        version: Version.fromString(newVersion),
        type: fallbackPath.type || '',
        field: fallbackPath.field || '',
      })
      // Show toast notification if schema location redirect will occur
      if (redirectDescription) {
        Stores.Toast.store.info(redirectDescription, {
          duration: 160_000,
          actions: [
            {
              label: 'Go back',
              onClick() {
                navigate(-1)
              },
            },
            {
              label: 'View changelog',
              onClick() {
                // Navigate to changelog page
                navigate('/changelog')
              },
            },
          ],
        })
      }

      navigate(newPath)
    }, 'Failed to switch version')

    // Fallback logic if error occurred
    if (error) {
      // Fallback to simple navigation if schema loading fails
      const newPath = Api.Schema.Routing.createReferencePath({
        version: Version.fromString(newVersion),
        type: currentPath.type || '',
        field: currentPath.field || '',
      })
      navigate(newPath)
    }
  }

  return (
    <VersionPicker
      versions={data}
      currentVersion={current}
      onVersionChange={handleVersionChange}
    />
  )
}
