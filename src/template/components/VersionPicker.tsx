import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { Select } from '@radix-ui/themes'
import { useNavigate, useParams } from 'react-router'

interface Props {
  all: string[]
  current: string
}

export const VersionPicker: React.FC<Props> = ({ all, current }) => {
  const navigate = useNavigate()
  const params = useParams()

  // Don't show selector if only one version
  if (all.length <= 1) {
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
    <Select.Root value={current} onValueChange={handleVersionChange}>
      <Select.Trigger />
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
