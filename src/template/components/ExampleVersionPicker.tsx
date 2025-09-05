import { Catalog } from '#lib/catalog/$'
import { Document } from '#lib/document/$'
import { VersionSelection } from '#lib/version-selection/$'
import { Version } from '#lib/version/$'
import { Select } from '@radix-ui/themes'
import { Match } from 'effect'
import type { FC } from 'react'

interface Props {
  document: Document.Document
  schemaCatalog: Catalog.Catalog
  selectedVersion: Version.Version | null
  onVersionChange: (version: Version.Version) => void
}

/**
 * Version picker for examples that shows all schema versions.
 * Groups versions that share the same document into single entries.
 */
export const ExampleVersionPicker: FC<Props> = ({
  document,
  schemaCatalog,
  selectedVersion,
  onVersionChange,
}) => {
  // For unversioned, don't show picker
  if (Document.Unversioned.is(document)) return null

  // Build version selections (single versions or sets)
  const selections: VersionSelection.VersionSelection[] = Match.value(document).pipe(
    Match.tagsExhaustive({
      DocumentUnversioned: () => [],

      DocumentVersioned: (doc) => {
        return Document.Versioned.getSelections(doc)
      },
    }),
  )

  // Don't show picker if there's only one selection or none
  if (selections.length <= 1) return null

  // Find which selection contains the selected version
  const selectedSelection = selectedVersion
    ? selections.find(sel => VersionSelection.contains(sel, selectedVersion))
    : null

  return (
    <Select.Root
      value={selectedSelection ? VersionSelection.toLabel(selectedSelection) : undefined}
      onValueChange={(label) => {
        // Find selection by label and pick first version from it
        const selection = selections.find(s => VersionSelection.toLabel(s) === label)
        if (selection) {
          const versions = VersionSelection.toVersions(selection)
          const version = versions[0]
          if (version) onVersionChange(version)
        }
      }}
    >
      <Select.Trigger>
        {selectedSelection ? VersionSelection.toLabel(selectedSelection) : 'Select version'}
      </Select.Trigger>
      <Select.Content position='popper' sideOffset={5}>
        {selections.map(selection => (
          <Select.Item
            key={VersionSelection.toLabel(selection)}
            value={VersionSelection.toLabel(selection)}
          >
            {VersionSelection.toLabel(selection)}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}
