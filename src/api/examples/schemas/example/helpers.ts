import { Document } from '#lib/document/$'
import { Match } from 'effect'
import type { Example } from './example.js'

/**
 * Convert an Example to a Document by extracting just the content.
 * This removes the example-specific metadata (name, path).
 */
export const exampleToDocument = (example: Example): Document.Document =>
  Match.value(example).pipe(
    Match.tagsExhaustive({
      ExampleUnversioned: (e) =>
        Document.Unversioned.make({
          document: e.document,
        }),
      ExampleVersioned: (e) =>
        Document.Versioned.make({
          versionDocuments: e.versionDocuments,
        }),
      ExamplePartiallyVersioned: (e) =>
        Document.PartiallyVersioned.make({
          versionDocuments: e.versionDocuments,
          defaultDocument: e.defaultDocument,
        }),
    }),
  )