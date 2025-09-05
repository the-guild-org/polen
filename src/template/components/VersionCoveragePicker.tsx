import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { VersionCoverage } from '#lib/version-selection/$'
import { Select } from '@radix-ui/themes'
import { HashMap } from 'effect'
import type { FC } from 'react'

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

  const options = Array.from(HashMap.keys(document.versionDocuments))
  if (options.length === 0) return null

  return (
    <Select.Root
      value={VersionCoverage.toLabel(current)}
      onValueChange={(label) => {
        // Find selection by label and pick first version from it
        const selection = options.find(s => VersionCoverage.toLabel(s) === label)
        if (selection) {
          const versions = VersionCoverage.toVersions(selection)
          const version = versions[0]
          if (version) onChange(version)
        }
      }}
    >
      <Select.Trigger>
        {VersionCoverage.toLabel(current)}
      </Select.Trigger>
      <Select.Content position='popper' sideOffset={5}>
        {options.map(selection => (
          <Select.Item
            key={VersionCoverage.toLabel(selection)}
            value={VersionCoverage.toLabel(selection)}
          >
            {VersionCoverage.toLabel(selection)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
