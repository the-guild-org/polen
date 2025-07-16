import { VERSION_LATEST } from './constants.js'

export interface ReferencePathParts {
  version?: string
  type?: string
  field?: string
}

export const createReferencePath = (parts: ReferencePathParts): string => {
  const basePath = createReferenceBasePath(parts.version)
  return joinSegmentsAndPaths(basePath, parts.type, parts.field)
}

/**
 * Create a base path for reference pages based on the current version
 * Used for sidebar navigation and other UI components that need version-aware paths
 */
export const createReferenceBasePath = (version?: string): string => {
  return joinSegmentsAndPaths(segmentLiterals.reference, createReferenceVersionPath(version))
}

export const segmentLiterals = {
  reference: 'reference',
  version: 'version',
}

/**
 * Create a base path for reference pages based on the current version
 * Used for sidebar navigation and other UI components that need version-aware paths
 */
export const createReferenceVersionPath = (version?: string): string => {
  if (version === undefined) return ''
  return version === VERSION_LATEST
    ? ``
    : `/${segmentLiterals.version}/${version}`
}

export const joinSegmentsAndPaths = (
  ...segmentsOrPaths: (string | undefined | null | (string | null | undefined)[])[]
): string => {
  const path = '/' + segmentsOrPaths
    .flat()
    .filter((_): _ is string => _ !== undefined && _ !== null && _ !== '')
    .map(chunkUnformatted =>
      chunkUnformatted
        .replace(/^\//, '')
        .replace(/\/$/, '')
    )
    .join('/')

  return path
}
