import { Ar } from '#dep/effect'
import { HashMap } from 'effect'
import { Catalog, Document, VersionCoverage } from 'graphql-kit'
import type { FC } from 'react'
import { Select } from './ui/index.js'

interface Props {
  document: Document.Document
  schemaCatalog: Catalog.Catalog
  current: VersionCoverage.VersionCoverage
  onChange: (versionCoverage: VersionCoverage.VersionCoverage) => void
}

/**
 * Version picker for examples that shows all schema versions.
 * Groups versions that share the same document into single entries.
 */
export const VersionCoveragePicker: FC<Props> = ({
  document,
  current,
  onChange,
}) => {
  if (Document.Unversioned.is(document)) return null

  const options = Ar.fromIterable(HashMap.keys(document.versionDocuments))
  if (options.length === 0) return null

  // Helper to format labels with proper Version/Versions prefix
  const formatLabel = (versionCoverage: VersionCoverage.VersionCoverage): string => {
    const prefix = VersionCoverage.One.is(versionCoverage) ? 'Version' : 'Versions'
    return `${prefix} ${VersionCoverage.toLabel(versionCoverage)}`
  }

  return (
    <Select.Root
      value={VersionCoverage.toLabel(current)}
      onValueChange={(label) => {
        // Find the full version coverage by label and pass it entirely
        const selection = options.find(s => VersionCoverage.toLabel(s) === label)
        if (selection) {
          // Pass the entire VersionCoverage, not just the first version
          onChange(selection)
        }
      }}
    >
      <Select.Trigger>
        {formatLabel(current)}
      </Select.Trigger>
      <Select.Content position='popper' sideOffset={5}>
        {options.map(selection => (
          <Select.Item
            key={VersionCoverage.toLabel(selection)}
            value={VersionCoverage.toLabel(selection)}
          >
            {formatLabel(selection)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
