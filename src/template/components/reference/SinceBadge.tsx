import { Api } from '#api/iso'
import type { Lifecycles } from '#lib/lifecycles/$'
import { Version } from '#lib/version/$'
import { Badge, Link } from '@radix-ui/themes'
import { Match } from 'effect'
import type React from 'react'

export const SinceBadge: React.FC<{ since: Lifecycles.Since }> = ({ since }) => {
  return (
    since._tag === 'initial'
      ? (
        <Badge color='blue' variant='soft' size='1'>
          Since initial version
        </Badge>
      )
      : (
        <Link
          href={Api.Schema.Routing.createChangelogUrl(
            since.revision.date,
            since.schema,
          )}
          style={{ textDecoration: 'none' }}
        >
          <Badge color='green' variant='soft' size='1' style={{ cursor: 'pointer' }}>
            Added {Match.value(since.schema).pipe(
              Match.tagsExhaustive({
                SchemaVersioned: (s) => `${Version.encodeSync(s.version)}@${since.revision.date}`,
                SchemaUnversioned: () => since.revision.date,
              }),
            )}
          </Badge>
        </Link>
      )
  )
}
