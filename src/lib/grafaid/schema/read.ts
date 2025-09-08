import { FileSystem } from '@effect/platform/FileSystem'
import { Fs } from '@wollybeard/kit'
import { Effect } from 'effect'
import { type GraphQLSchema } from 'graphql'
import * as Parse from '../parse.js'
import { fromAST } from './schema.js'

export const read = (sdlFilePath: string): Effect.Effect<null | Fs.File<GraphQLSchema>, Error, FileSystem> =>
  Effect.gen(function*() {
    const fs = yield* FileSystem

    // Check if file exists
    const exists = yield* Effect.either(fs.exists(sdlFilePath))
    if (exists._tag === 'Left' || !exists.right) {
      return null
    }

    // Read file content
    const content = yield* fs.readFileString(sdlFilePath)

    // Parse and build schema
    const node = yield* Parse.parseSchema(content, { source: sdlFilePath })
    const schema = yield* fromAST(node)

    return {
      path: sdlFilePath,
      content: schema,
    }
  })
