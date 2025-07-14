import { Select } from '@radix-ui/themes'
import { useNavigate, useParams } from 'react-router'

interface VersionSelectorProps {
  availableVersions: string[]
  currentVersion: string
}

export const VersionSelector = ({ availableVersions, currentVersion }: VersionSelectorProps) => {
  const navigate = useNavigate()
  const params = useParams()
  
  // Don't show selector if only one version
  if (availableVersions.length <= 1) {
    return null
  }
  
  const handleVersionChange = (newVersion: string) => {
    // Build new path preserving the current type/field if any
    const currentType = params[`type`]
    const currentField = params[`field`]
    
    let newPath = `/reference`
    if (newVersion !== `latest`) {
      newPath += `/${newVersion}`
    }
    if (currentType) {
      newPath += `/${currentType}`
      if (currentField) {
        newPath += `/${currentField}`
      }
    }
    
    navigate(newPath)
  }
  
  return (
    <Select.Root value={currentVersion} onValueChange={handleVersionChange}>
      <Select.Trigger />
      <Select.Content>
        {availableVersions.map(version => (
          <Select.Item key={version} value={version}>
            {version === `latest` ? `Latest` : version}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}