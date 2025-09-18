// TODO: Review and replace inline styles with Tailwind classes
import type { ExampleReference } from '#api/examples/schemas/type-usage-index'
import { Str } from '@wollybeard/kit'
import { Version } from 'graphql-kit'
import type { FC } from 'react'
import { Badge, Link } from './ui/index.js'

export interface Props {
  exampleRef: ExampleReference
}

/**
 * Component for rendering a link to an example at a specific version.
 * Always includes the version query parameter for consistent behavior.
 */
export const ExampleLink: FC<Props> = ({ exampleRef }) => {
  // Include version parameter only if version exists
  const href = exampleRef.version
    ? `/examples/${exampleRef.name}?version=${Version.encodeSync(exampleRef.version)}`
    : `/examples/${exampleRef.name}`

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Badge variant='soft' size='2' style={{ cursor: 'pointer' }}>
        {Str.titlizeSlug(exampleRef.name)}
      </Badge>
    </Link>
  )
}
