import type { ExampleReference } from '#api/examples/schemas/type-usage-index'
import { Version } from '#lib/version/$'
import { Badge, Link } from '@radix-ui/themes'
import type { FC } from 'react'

export interface Props {
  exampleRef: ExampleReference
}

/**
 * Component for rendering a link to an example at a specific version.
 * Always includes the version query parameter for consistent behavior.
 */
export const ExampleLink: FC<Props> = ({ exampleRef }) => {
  // Always include version parameter for consistency
  const href = `/examples/${exampleRef.name}?version=${Version.encodeSync(exampleRef.version)}`

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Badge variant='soft' size='2' style={{ cursor: 'pointer' }}>
        {exampleRef.name}
      </Badge>
    </Link>
  )
}
