import { Api } from '#api/iso'
import type { React } from '#dep/react/index'
import { useVersionPath } from '../hooks/useVersionPath.js'
import { Link } from './Link.js'

/**
 * Link component for GraphQL schema references that preserves version context
 *
 * @example
 * <ReferenceLink type="User">User</ReferenceLink>
 * <ReferenceLink type="User" field="name">User.name</ReferenceLink>
 */
export const ReferenceLink: React.FC<{
  /** The GraphQL type name */
  type: string
  /** Optional field name for field-specific links */
  field?: string
  /** Link content */
  children: React.ReactNode
}> = ({ type, field, children }) => {
  const versionPath = useVersionPath()

  const path = Api.Schema.Routing.joinSegmentsAndPaths(
    Api.Schema.Routing.segmentLiterals.reference,
    versionPath,
    type,
    field,
  )

  return (
    <Link to={path}>
      {children}
    </Link>
  )
}
