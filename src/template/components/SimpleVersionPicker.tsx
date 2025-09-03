import type { React } from '#dep/react/index'
import { Version } from '#lib/version/$'
import { Select } from '@radix-ui/themes'

interface Props {
  versions: readonly Version.Version[]
  currentVersion: Version.Version
  onVersionChange: (version: Version.Version) => void
  label?: string
}

/**
 * A generic version picker component that can be used for any versioned content.
 * This is a controlled component - parent manages the state.
 */
export const SimpleVersionPicker: React.FC<Props> = ({
  versions,
  currentVersion,
  onVersionChange,
  label = '',
}) => {
  // Don't show selector if only one version
  if (versions.length <= 1) {
    return null
  }

  return (
    <Select.Root
      value={Version.toString(currentVersion)}
      onValueChange={(versionEncoded) => onVersionChange(Version.fromString(versionEncoded))}
    >
      <Select.Trigger style={{ minWidth: '120px' }}>
        {label}
        {label ? ' ' : ''}
        {Version.toString(currentVersion)}
      </Select.Trigger>
      <Select.Content position='popper' sideOffset={5}>
        {versions.map(version => (
          <Select.Item key={Version.toString(version)} value={Version.toString(version)}>
            {label}
            {label ? ' ' : ''}
            {Version.toString(version)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
