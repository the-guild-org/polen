'use client'

import type { Schema } from '#api/schema/index'
import { superjson } from '#singletons/superjson'
import type { SuperJSONResult } from 'superjson'
import { Changelog } from '../components/Changelog.js'

interface Props {
  serializedSchema: SuperJSONResult
}

export function ComponentChangelogClient({ serializedSchema }: Props) {
  const schema = superjson.deserialize(serializedSchema) as Schema.Schema
  return <Changelog schema={schema} />
}
