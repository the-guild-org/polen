import { S } from '#dep/effect'

// ============================================================================
// Route Schema
// ============================================================================

const RouteSchema = S.String

// ============================================================================
// Generate Result Schema
// ============================================================================

const GenerateResultSchema = S.Struct({
  success: S.Boolean,
  processedCount: S.Number,
  duration: S.Number,
  memoryUsed: S.Number,
  error: S.optional(S.String),
  failures: S.optional(
    S.Array(
      S.Struct({
        route: S.String,
        error: S.String,
      }),
    ),
  ),
})

export type GenerateResult = S.Schema.Type<typeof GenerateResultSchema>

// ============================================================================
// Server Messages
// ============================================================================

export class StartServerMessage extends S.TaggedRequest<StartServerMessage>()(
  'StartServer',
  {
    failure: S.Never,
    payload: {
      serverPath: S.String,
      port: S.Number,
    },
    success: S.Void,
  },
) {}

export class StopServerMessage extends S.TaggedRequest<StopServerMessage>()(
  'StopServer',
  {
    failure: S.Never,
    payload: {
      port: S.optional(S.Number),
    },
    success: S.Void,
  },
) {}

export type ServerMessage = StartServerMessage | StopServerMessage
export const ServerMessage = S.Union(StartServerMessage, StopServerMessage)

// ============================================================================
// Page Generator Messages
// ============================================================================

export class GeneratePagesMessage extends S.TaggedRequest<GeneratePagesMessage>()(
  'GeneratePages',
  {
    failure: S.String,
    payload: {
      routes: S.Array(RouteSchema),
      serverPort: S.Number,
      outputDir: S.String,
      basePath: S.optional(S.String),
    },
    success: GenerateResultSchema,
  },
) {}

export type PageMessage = GeneratePagesMessage
export const PageMessage = S.Union(GeneratePagesMessage)
