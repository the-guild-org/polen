import type { ChangeSet, ChangeSetLinked } from './changeset.js'

// Changelog

export type Changelog = [ChangeSet, ...ChangeSet[]]

// Linked

export type ChangelogLinked = [ChangeSetLinked, ...ChangeSetLinked[]]
