import { z } from 'zod/v4'

// Schema for demo configuration
export const DemoOptionsSchema = z.object({
  examples: z.object({
    exclude: z.array(z.string()).optional(),
    order: z.array(z.string()).optional(),
    /**
     * Minimum version of this package needed to run the demos.
     */
    minimumVersion: z.string().optional(),
    /**
     * Disabled demos that are listed in UI but not available
     */
    disabled: z.array(z.object({
      example: z.string(),
      reason: z.string(),
    })).optional(),
  }).optional(),
  deployment: z.object({
    basePaths: z.record(z.string(), z.string()).optional(),
    redirects: z.array(z.object({
      from: z.string(),
      to: z.string(),
    })).optional(),
    gc: z.object({
      retainStableVersions: z.boolean().optional(),
      retainCurrentCycle: z.boolean().optional(),
      retainDays: z.number().optional(),
    }).optional(),
  }).optional(),
  ui: z.object({
    theme: z.object({
      primaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      mutedTextColor: z.string().optional(),
    }).optional(),
    content: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      logoUrl: z.string().optional(),
    }).optional(),
  }).optional(),
})

export type DemoOptions = z.infer<typeof DemoOptionsSchema>
