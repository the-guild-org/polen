import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { Catalog } from '#lib/catalog/$'
import { Version } from '#lib/version/$'
import { Select } from '@radix-ui/themes'
import { Effect } from 'effect'
import { useNavigate } from 'react-router'
import { catalogBridge } from '../catalog-bridge.js'
import { useReferencePath } from '../hooks/useReferencePath.js'
import { Stores } from '../stores/$.js'
import { tryWithToast } from '../utils/try-with-toast.js'

interface Props {
  all: string[]
  current: string
}

export const VersionPicker: React.FC<Props> = ({ all, current }) => {
  const navigate = useNavigate()
  const currentPath = useReferencePath()

  // Don't show selector if only one version
  if (all.length <= 1) {
    return null
  }

  const handleVersionChange = async (newVersion: string) => {
    const error = await tryWithToast(async () => {
      // Get the full catalog to find the target schema
      const catalog = await Effect.runPromise(catalogBridge.view())

      // This component is only used for versioned catalogs
      if (catalog._tag !== 'CatalogVersioned') {
        throw new Error('VersionPicker used with non-versioned catalog')
      }

      // Find the schema for the target version
      let targetSchema
      if (newVersion === Api.Schema.VERSION_LATEST) {
        const latestEntry = catalog.entries[catalog.entries.length - 1]
        targetSchema = latestEntry?.schema
      } else {
        const entry = catalog.entries.find(e => Version.toString(e.schema.version) === newVersion)
        targetSchema = entry?.schema
      }

      if (!targetSchema) {
        throw new Error(`Version ${newVersion} not found`)
      }

      // Find fallback path if needed
      const fallbackPath = Api.Schema.Validation.findFallbackPath(targetSchema.definition, currentPath)
      // Get redirect description if path changed
      const redirectDescription = Api.Schema.Validation.getRedirectDescription(
        targetSchema.definition,
        currentPath,
        fallbackPath,
        newVersion,
      )
      // Create the new path
      const newPath = Api.Schema.Routing.createReferencePath({
        version: newVersion,
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
        version: newVersion,
        type: currentPath.type || '',
        field: currentPath.field || '',
      })
      navigate(newPath)
    }
  }

  return (
    <Select.Root value={current} onValueChange={handleVersionChange}>
      <Select.Trigger>
        {current === Api.Schema.VERSION_LATEST ? `Latest` : current}
      </Select.Trigger>
      <Select.Content>
        {all.map(version => (
          <Select.Item key={version} value={version}>
            {version === Api.Schema.VERSION_LATEST ? `Latest` : version}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
