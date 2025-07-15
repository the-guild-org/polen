import { useParams } from 'react-router'

/**
 * Custom hook to generate version path for versioned routes
 * Returns the appropriate path prefix for the current version
 */
export const useVersionPath = (): string => {
  const params = useParams()
  return params[`version`] ? `version/${params[`version`]}/` : ``
}
