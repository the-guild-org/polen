import { Api } from '#api/iso'
import { useLocation, useParams } from 'react-router'

/**
 * Hook that returns parsed reference path parameters
 *
 * @throws {Error} If not currently on a reference route
 * @returns Parsed reference path object
 */
export const useReferencePath = (): Api.Schema.Validation.PathValidation => {
  const params = useParams()
  const location = useLocation()

  Api.Schema.Routing.assertReferenceRoute({
    pathname: location.pathname,
    params,
  })

  return params
}
