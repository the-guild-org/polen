import { z } from 'zod'

/**
 * Schema for validating front matter content
 */
export const MetadataSchema = z.object({
  description: z.string().optional(),
  hidden: z.boolean().default(false),
})

export type Metadata = z.infer<typeof MetadataSchema>
