'use client'

import { Grafaid } from '#lib/grafaid/index'
import { superjson } from '#singletons/superjson'
import type { GraphQLSchema } from 'graphql'
import type { SuperJSONResult } from 'superjson'
import { Field } from '../components/Field.js'

interface Props {
  serializedSchema: SuperJSONResult
  typeParam: string
  fieldParam: string
}

export function ComponentReferenceTypeFieldClient({ serializedSchema, typeParam, fieldParam }: Props) {
  const schema = superjson.deserialize(serializedSchema) as GraphQLSchema
  
  const type = schema.getType(typeParam)
  if (!type) return `Could not find type ${typeParam}`
  if (!Grafaid.Schema.TypesLike.isFielded(type)) {
    return `Type ${typeParam} does not have fields`
  }

  const fields = type.getFields()
  const field = fields[fieldParam]
  if (!field) {
    return `Could not find field ${fieldParam} on type ${typeParam}`
  }

  return <Field data={field} />
}