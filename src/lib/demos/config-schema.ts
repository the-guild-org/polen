/**
 * Schema definitions for demo configuration
 */

import { z } from 'zod'

// Schema for demo configuration
export const DemoConfigSchema = z.object({
  examples: z.object({
    exclude: z.array(z.string()).default([]),
    order: z.array(z.string()).default([]),
    /**
     * Minimum version of this package needed to run the demos.
     */
    minimumVersion: z.string().default(`0.1.0`),
  }),
  deployment: z.object({
    basePaths: z.record(z.string()).default({}),
    redirects: z.array(z.object({
      from: z.string(),
      to: z.string(),
    })).default([]),
    gc: z.object({
      retainStableVersions: z.boolean().default(true),
      retainCurrentCycle: z.boolean().default(true),
      retainDays: z.number().default(30),
    }).default({}),
  }),
  ui: z.object({
    theme: z.object({
      primaryColor: z.string().default(`#000`),
      backgroundColor: z.string().default(`#fff`),
      textColor: z.string().default(`#000`),
      mutedTextColor: z.string().default(`#666`),
    }).default({}),
    branding: z.object({
      title: z.string().default(`Polen Demos`),
      description: z.string().default(`Interactive GraphQL API documentation`),
      logoUrl: z.string().optional(),
    }).default({}),
  }),
  metadata: z.object({
    disabledDemos: z.record(z.object({
      title: z.string(),
      description: z.string(),
      reason: z.string().optional(),
    })).default({}),
  }),
})

export type DemoConfigData = z.infer<typeof DemoConfigSchema>

// Legacy schema for backward compatibility
export const LegacyDemoConfigSchema = z.object({
  excludeDemos: z.array(z.string()).optional(),
  minimumVersion: z.string().optional(),
  minimumPolenVersion: z.string().optional(),
  order: z.array(z.string()).optional(),
})
