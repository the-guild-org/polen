import type { DocumentNode } from 'graphql'
import { buildASTSchema } from 'graphql'
import { SchemaAugmentation } from '../../api/schema-augmentation/index.js'
import { schemaAugmentations } from 'virtual:polen/template/schema-augmentations'

export const getSchema = (documentNode: DocumentNode) => {
  const isClient = typeof window !== `undefined`
  const cachedValue = isClient && window.__polenCacheSchema
  if (cachedValue) return cachedValue

  const schema = buildASTSchema(documentNode)
  const schemaAugmented = SchemaAugmentation.apply(schema, schemaAugmentations)

  if (isClient) {
    window.__polenCacheSchema = schemaAugmented
  }

  return schemaAugmented
}
