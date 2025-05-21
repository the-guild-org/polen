import { Fs } from '@wollybeard/kit'
import { buildASTSchema, type GraphQLSchema, parse } from 'graphql'

export const read = async (sdlFilePath: string): Promise<null | Fs.File<GraphQLSchema>> => {
  const content = await Fs.read(sdlFilePath)
  if (!content) return null
  const node = parse(content)
  const schema = buildASTSchema(node)
  return {
    path: sdlFilePath,
    content: schema,
  }
}
