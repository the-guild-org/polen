'use client'

import { superjson } from '#singletons/superjson'
import type { GraphQLSchema } from 'graphql'
import type { SuperJSONResult } from 'superjson'
import { NamedType } from '../components/NamedType.js'

interface Props {
  serializedSchema: SuperJSONResult
  typeParam: string
}

export function ComponentReferenceTypeClient({ serializedSchema, typeParam }: Props) {
  const schema = superjson.deserialize(serializedSchema) as GraphQLSchema
  const type = schema.getType(typeParam)
  
  if (!type) {
    return `Could not find type ${typeParam}`
  }

  return <NamedType data={type} />
}