import { Fs } from '#dep/fs/index.js'
import { type DocumentNode, type GraphQLSchema, Kind, buildASTSchema, parse } from 'graphql'

export {
  type DocumentNode,
  GraphQLSchema as Schema,
  buildASTSchema as fromAST,
  parse,
  printSchema as print,
} from 'graphql'

export const read = async (sdlFilePath: string): Promise<Fs.File<GraphQLSchema>> => {
  const sdlFile = await Fs.read(sdlFilePath)
  if (!sdlFile) throw new Error(`Schema file ${sdlFilePath} does not exist.`)
  const node = parse(sdlFile.content)
  const schema = buildASTSchema(node)
  return {
    path: sdlFilePath,
    content: schema,
  }
}

export const astEmpty: DocumentNode = { definitions: [], kind: Kind.DOCUMENT }
export const empty: GraphQLSchema = buildASTSchema(astEmpty)
