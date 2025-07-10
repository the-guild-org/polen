import type { GrafaidOld } from '#lib/grafaid-old/index'
import { CRITICALITY_LEVELS } from '#lib/graphql-change/criticality'
import { GraphqlChange } from '#lib/graphql-change/index'
import type { GraphqlChangeset } from '#lib/graphql-changeset/index'
import type { CriticalityLevel } from '@graphql-inspector/core'
import { Box } from '@radix-ui/themes'
import { neverCase } from '@wollybeard/kit/language'
import type React from 'react'
import { useMemo } from 'react'
import type { Schema as ChangelogData } from '../../api/schema/index.js'
import { CriticalitySection } from './Changelog/CriticalitySection.js'
import * as Group from './Changelog/groups/index.js'

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
      {schema.versions.map(changeset => <Changeset key={changeset.date.toISOString()} changeset={changeset} />)}
    </Box>
  )
}

const Changeset: React.FC<{ changeset: GraphqlChangeset.ChangeSet }> = ({ changeset }) => {
  // Group changes by criticality level
  const groupedChanges = useMemo(() => {
    const groups = {} as Record<CriticalityLevel, GraphqlChange.Change[]>

    // Initialize empty arrays for each level
    CRITICALITY_LEVELS.forEach(level => {
      groups[level] = []
    })

    // Group changes
    changeset.changes.forEach(change => {
      const level = change.criticality.level
      if (groups[level]) {
        groups[level].push(change)
      }
    })

    // Return only non-empty groups in order
    return CRITICALITY_LEVELS
      .filter(level => groups[level].length > 0)
      .map(level => ({
        level,
        changes: groups[level],
      }))
  }, [changeset.changes])

  return (
    <Box mb='6'>
      <h1 title={changeset.date.toISOString()} id={changeset.date.toISOString()}>
        {renderDate(changeset.date)}
      </h1>
      {groupedChanges.map(group => (
        <CriticalitySection key={group.level} level={group.level} changes={group.changes}>
          {group.changes.map(change => (
            <Change key={`${change.type}-${change.path || change.message}`} change={change} schema={changeset.after} />
          ))}
        </CriticalitySection>
      ))}
    </Box>
  )
}

const Change: React.FC<{ change: GraphqlChange.Change; schema: GrafaidOld.Schema.Schema }> = (
  { change, schema },
) => {
  if (GraphqlChange.Group.isTypeOperation(change)) {
    return <Group.TypeOperation change={change} />
  } else if (GraphqlChange.Group.isTypeDescription(change)) {
    return <Group.TypeDescription change={change} />
  } else if (GraphqlChange.Group.isFieldOperation(change)) {
    return <Group.FieldOperation change={change} />
  } else if (GraphqlChange.Group.isFieldDescription(change)) {
    return <Group.FieldDescription change={change} />
  } else if (GraphqlChange.Group.isFieldDeprecation(change)) {
    return <Group.FieldDeprecation change={change} />
  } else if (GraphqlChange.Group.isFieldDeprecationReason(change)) {
    return <Group.FieldDeprecationReason change={change} />
  } else if (GraphqlChange.Group.isFieldArgumentOperation(change)) {
    return <Group.FieldArgumentOperation change={change} />
  } else if (GraphqlChange.Group.isFieldArgument(change)) {
    return <Group.FieldArgument change={change} />
  } else if (GraphqlChange.Group.isFieldArgumentDescription(change)) {
    return <Group.FieldArgumentDescription change={change} />
  } else if (GraphqlChange.Group.isEnumValueOperation(change)) {
    return <Group.EnumValueOperation change={change} />
  } else if (GraphqlChange.Group.isEnumValueDescription(change)) {
    return <Group.EnumValueDescription change={change} />
  } else if (GraphqlChange.Group.isEnumValueDeprecationReason(change)) {
    return <Group.EnumValueDeprecationReason change={change} />
  } else if (GraphqlChange.Group.isInputFieldOperation(change)) {
    return <Group.InputFieldOperation change={change} />
  } else if (GraphqlChange.Group.isInputFieldDescription(change)) {
    return <Group.InputFieldDescription change={change} />
  } else if (GraphqlChange.Group.isInputFieldDefaultValue(change)) {
    return <Group.InputFieldDefaultValue change={change} />
  } else if (GraphqlChange.Group.isUnionMemberOperation(change)) {
    return <Group.UnionMemberOperation change={change} />
  } else if (GraphqlChange.Group.isObjectTypeInterfaceOperation(change)) {
    return <Group.ObjectTypeInterfaceOperation change={change} />
  } else if (GraphqlChange.Group.isDirectiveOperation(change)) {
    return <Group.DirectiveOperation change={change} />
  } else if (GraphqlChange.Group.isDirectiveDescription(change)) {
    return <Group.DirectiveDescription change={change} />
  } else if (GraphqlChange.Group.isDirectiveLocationOperation(change)) {
    return <Group.DirectiveLocationOperation change={change} />
  } else if (GraphqlChange.Group.isDirectiveArgumentOperation(change)) {
    return <Group.DirectiveArgumentOperation change={change} />
  } else if (GraphqlChange.Group.isDirectiveArgument(change)) {
    return <Group.DirectiveArgument change={change} />
  } else if (GraphqlChange.Group.isDirectiveArgumentDescription(change)) {
    return <Group.DirectiveArgumentDescription change={change} />
  } else if (GraphqlChange.Group.isSchemaRootType(change)) {
    return <Group.SchemaRootType change={change} />
  } else if (GraphqlChange.Group.isDirectiveUsage(change)) {
    return <Group.DirectiveUsage change={change} />
  } else {
    neverCase(change)
  }
}
