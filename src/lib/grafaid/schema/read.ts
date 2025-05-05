import { Fs } from '#dep/fs/index.js'
import { type GraphQLSchema, buildASTSchema, parse } from 'graphql'

export const read = async (sdlFilePath: string): Promise<null | Fs.File<GraphQLSchema>> => {
  const sdlFile = await Fs.read(sdlFilePath)
  if (!sdlFile) return null
  const node = parse(sdlFile.content)
  const schema = buildASTSchema(node)
  return {
    path: sdlFilePath,
    content: schema,
  }
}
