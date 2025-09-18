// TODO: Review and replace inline styles with Tailwind classes
import { Version } from 'graphql-kit'
import type * as React from 'react'
import { Select } from './ui/index.js'

interface Props {
  versions: readonly Version.Version[]
  currentVersion: Version.Version
  onVersionChange: (version: Version.Version) => void
}

/**
 * A generic version picker component that can be used for any versioned content.
 * This is a controlled component - parent manages the state.
 */
export const VersionPicker: React.FC<Props> = ({
  versions,
  currentVersion,
  onVersionChange,
}) => {
  // Don't show selector if only one version
  if (versions.length <= 1) {
    return null
  }

  return (
    <Select.Root
      value={Version.encodeSync(currentVersion)}
      onValueChange={(versionEncoded) => onVersionChange(Version.fromString(versionEncoded))}
    >
      <Select.Trigger style={{ minWidth: '120px' }}>
        Version {Version.encodeSync(currentVersion)}
      </Select.Trigger>
      <Select.Content position='popper' sideOffset={5}>
        {versions.map(version => (
          <Select.Item key={Version.encodeSync(version)} value={Version.encodeSync(version)}>
            Version {Version.encodeSync(version)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
