import { Api } from '#api/iso'
import { useParams } from 'react-router'

/**
 * Custom hook to generate version path for versioned routes
 * Returns the appropriate path prefix for the current version
 */
export const useVersionPath = (): string => {
  const params = useParams()
  const version = params[`version`] || Api.Schema.VERSION_LATEST
  return Api.Schema.Routing.createReferenceVersionPath(version)
}
