import { Api } from '#api/iso'
import { Version } from 'graphql-kit'
import { useParams } from 'react-router'

/**
 * Custom hook to generate version path for versioned routes
 * Returns the appropriate path prefix for the current version
 */
export const useVersionPath = (): string => {
  const params = useParams()
  const versionParam = params[`version`]
  if (!versionParam) {
    return ''
  }
  const version = Version.fromString(versionParam)
  return Api.Schema.Routing.createReferenceVersionPath(version)
}
