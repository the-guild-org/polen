import type { GrafaidOld } from '#lib/grafaid-old'
import { Grafaid } from '#lib/grafaid'
import type { GraphqlChange } from '#lib/graphql-change'
import type { GraphqlChangeset } from '#lib/graphql-changeset'
import { Box, Code } from '@radix-ui/themes'
import type React from 'react'
import type { Schema as ChangelogData } from '../../api/schema/index.ts'
import { Graphql } from './graphql/index.ts'

export const renderDate = (date: Date) => {
  return date.toLocaleString(`default`, {
    month: `long`,
    year: `numeric`,
    day: `numeric`,
    timeZone: `utc`,
  })
}

export const Changelog: React.FC<{ schema: ChangelogData.Schema }> = ({ schema }) => {
  return (
    <Box>
      {schema.versions.map(changeset => <Changeset key={changeset.date.getDate()} changeset={changeset} />)}
    </Box>
  )
}

const Changeset: React.FC<{ changeset: GraphqlChangeset.ChangeSet }> = ({ changeset }) => {
  return (
    <Box>
      <h1 title={changeset.date.toISOString()}>
        {renderDate(changeset.date)}
      </h1>
      <ul>
        {changeset.changes.map(change => <Change key={change.message} change={change} schema={changeset.after} />)}
      </ul>
    </Box>
  )
}

const Change: React.FC<{ change: GraphqlChange.Change; schema: GrafaidOld.Schema.Schema }> = (
  { change, schema },
) => {
  const getTypeOrThrow = (name: string) => {
    const type = schema.getType(name)
    if (!type) throw new Error(`Type ${name} not found`)
    return type
  }

  switch (change.type) {
    case `TYPE_ADDED`: {
      const type = getTypeOrThrow(change.meta.addedTypeName)
      return (
        <li>
          Added type <Graphql.TypeLink type={type} />
        </li>
      )
    }
    case `FIELD_ADDED`: {
      const rootTypeMap = Grafaid.Schema.getRootTypeMap(schema)
      const rootDetails = rootTypeMap.list.find(_ => _.name.canonical === change.meta.typeName)
      const type = getTypeOrThrow(change.meta.typeName)
      if (rootDetails) {
        return (
          <li>
            Added {rootDetails.operationType}
            {` `}
            <Code
              color='jade'
              variant='ghost'
              style={{ borderBottom: `1px dotted var(--jade-6)`, borderRadius: `0` }}
            >
              {change.meta.addedFieldName}
            </Code>
          </li>
        )
      }

      return (
        <li>
          Added field{` `}
          <Code
            color='gray'
            variant='ghost'
            style={{ borderBottom: `1px dotted var(--gray-6)`, borderRadius: `0` }}
          >
            {change.meta.addedFieldName}
          </Code>
          {` `}
          to type{` `}
          <Graphql.TypeLink type={type} />.
        </li>
      )
    }
    default:
      return <li>TODO: {change.type}</li>
  }
}
