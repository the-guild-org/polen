import { Select } from '@radix-ui/themes'
import React from 'react'
import { useNavigate } from 'react-router'

interface Props {
  versions: string[]
  currentVersion: string
}

export const ChangelogVersionPicker: React.FC<Props> = ({ versions, currentVersion }) => {
  const navigate = useNavigate()

  // Don't show selector if only one version
  if (versions.length <= 1) {
    return null
  }

  const handleVersionChange = (newVersion: string) => {
    navigate(`/changelog/version/${newVersion}`)
  }

  return (
    <Select.Root value={currentVersion} onValueChange={handleVersionChange}>
      <Select.Trigger>
        Version {currentVersion}
      </Select.Trigger>
      <Select.Content>
        {versions.map(version => (
          <Select.Item key={version} value={version}>
            Version {version}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
