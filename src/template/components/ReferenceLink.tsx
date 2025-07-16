import { Api } from '#api/iso'
import type { ReactNode } from 'react'
import { useVersionPath } from '../hooks/useVersionPath.js'
import { Link } from './Link.js'

interface Props {
  /** The GraphQL type name */
  type: string
  /** Optional field name for field-specific links */
  field?: string
  /** Link content */
  children: ReactNode
}

/**
 * Link component for GraphQL schema references that preserves version context
 *
 * @example
 * <ReferenceLink type="User">User</ReferenceLink>
 * <ReferenceLink type="User" field="name">User.name</ReferenceLink>
 */
export const ReferenceLink = ({ type, field, children }: Props) => {
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
