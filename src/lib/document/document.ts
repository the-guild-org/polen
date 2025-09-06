import { Catalog } from '#lib/catalog/$'
import { S } from '#lib/kit-temp/effect'
import { Schema } from '#lib/schema/$'
import { VersionCoverage } from '#lib/version-coverage'
import { Version } from '#lib/version/$'
import { Option } from 'effect'
import { DocumentUnversioned } from './unversioned.js'
import * as DocumentVersioned from './versioned.js'

// ============================================================================
// Schema
// ============================================================================

/**
 * A Document represents versionable content that can be:
 * - Unversioned: A single document with no version support
 * - Versioned: Multiple versions mapped by version selections (single versions or version sets)
 */
export const Document = S.Union(
  DocumentUnversioned,
  DocumentVersioned.DocumentVersioned,
)

// ============================================================================
// Types
// ============================================================================

export type Document = typeof Document.Type

// ============================================================================
// Type Guards
// ============================================================================

export const is = S.is(Document)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Document)
export const decodeSync = S.decodeSync(Document)
export const encode = S.encode(Document)

// ============================================================================
// Domain Logic - Resolution Functions
// ============================================================================

/**
 * Resolve document content for a given version coverage.
 *
 * @param document - The document to resolve content from
 * @param versionCoverage - The version coverage to use (optional, defaults to latest)
 * @returns The resolved document content
 * @throws {Error} If version is not found in document
 */
export const resolveDocumentContent = (
  document: Document,
  versionCoverage?: VersionCoverage.VersionCoverage | null,
): string => {
  if (document._tag === 'DocumentUnversioned') {
    return document.document
  }

  // If no version coverage specified, use latest
  if (!versionCoverage) {
    return DocumentVersioned.getContentForLatestVersionOrThrow(document)
  }

  // Get the latest version from the coverage
  const version = VersionCoverage.getLatest(versionCoverage)
  const contentOption = DocumentVersioned.getContentForVersion(document, version)

  if (Option.isNone(contentOption)) {
    throw new Error(`Version ${Version.encodeSync(version)} not covered by document`)
  }

  return contentOption.value
}

/**
 * Resolve both document content and schema for a given version coverage.
 * This is the primary resolution function that handles all combinations
 * of versioned/unversioned documents and catalogs.
 *
 * @param document - The document to resolve content from
 * @param catalog - The schema catalog (optional)
 * @param versionCoverage - The version coverage to use (optional, defaults to latest)
 * @returns Object with resolved content and optional schema
 * @throws {Error} If versions don't match between document and catalog
 */
export const resolveDocumentAndSchema = (
  document: Document,
  catalog?: Catalog.Catalog,
  versionCoverage?: VersionCoverage.VersionCoverage | null,
): { content: string; schema?: Schema.Schema } => {
  // Handle unversioned document
  if (document._tag === 'DocumentUnversioned') {
    const result: { content: string; schema?: Schema.Schema } = {
      content: document.document,
    }
    if (catalog) {
      result.schema = Catalog.resolveCatalogSchema(catalog, null)
    }
    return result
  }

  // Handle versioned document
  const content = resolveDocumentContent(document, versionCoverage)

  if (!catalog) {
    return { content }
  }

  // Cannot use version coverage with unversioned catalog
  if (versionCoverage && Catalog.Unversioned.is(catalog)) {
    throw new Error('Cannot use a version coverage with an unversioned catalog')
  }

  const schema = Catalog.resolveCatalogSchema(catalog, versionCoverage)
  return { content, schema }
}
