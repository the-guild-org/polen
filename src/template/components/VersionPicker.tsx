import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { Select } from '@radix-ui/themes'
import { useNavigate } from 'react-router'
import { useReferencePath } from '../hooks/useReferencePath.js'
import { schemaSource } from '../sources/schema-source.js'
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
      // Check if current path exists in target version
      // We know this is versioned because VersionPicker is only rendered for versioned schemas
      const targetSchema = await (schemaSource as any).inner.get(newVersion)
      // Find fallback path if needed
      const fallbackPath = Api.Schema.Validation.findFallbackPath(targetSchema, currentPath)
      // Get redirect description if path changed
      const redirectDescription = Api.Schema.Validation.getRedirectDescription(
        targetSchema,
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
