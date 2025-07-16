import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { Select } from '@radix-ui/themes'
import { useNavigate, useParams } from 'react-router'

interface Props {
  availableVersions: string[]
  currentVersion: string
}

export const VersionSelector: React.FC<Props> = ({ availableVersions, currentVersion }) => {
  const navigate = useNavigate()
  const params = useParams()

  // Don't show selector if only one version
  if (availableVersions.length <= 1) {
    return null
  }

  const handleVersionChange = (newVersion: string) => {
    const newPath = Api.Schema.Routing.createReferencePath({
      version: newVersion,
      type: params[`type`],
      field: params[`field`],
    })

    navigate(newPath)
  }

  return (
    <Select.Root value={currentVersion} onValueChange={handleVersionChange}>
      <Select.Trigger />
      <Select.Content>
        {availableVersions.map(version => (
          <Select.Item key={version} value={version}>
            {version === Api.Schema.VERSION_LATEST ? `Latest` : version}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
