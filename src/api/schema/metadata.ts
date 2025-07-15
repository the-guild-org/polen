import { Fs } from '@wollybeard/kit'
import { z } from 'zod/v4'

export const SchemaMetadataSchema = z.object({
  /** Whether a schema is present in the project */
  hasSchema: z.boolean(),
  /** Array of available version identifiers */
  versions: z.array(z.string()),
})

export type SchemaMetadata = z.infer<typeof SchemaMetadataSchema>

export const getMetadata = async (path: string): Promise<SchemaMetadata> => {
  const result = await Fs.readJson(path)
  if (!result) {
    return {
      hasSchema: false,
      versions: [],
    }
  }

  return SchemaMetadataSchema.parse(result)
}
