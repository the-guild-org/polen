import { Fs } from '#dep/fs/index.js'
import { Path } from '#dep/path/index.js'
import { casesHandled } from '#lib/prelude/prelude.js'

export interface SchemaPointerFile {
  type: `file`
  path: string
}

export interface SchemaPointerInline {
  type: `inline`
  value: string
}

export type SchemaPointer = SchemaPointerFile | SchemaPointerInline

export const readSchemaPointer = async (
  schemaPointer: SchemaPointer,
  defaultBasePath: string,
): Promise<string> => {
  if (schemaPointer.type === `file`) {
    const path = Path.absolutify(schemaPointer.path, defaultBasePath)
    return Fs.readFile(path, `utf-8`)
    // eslint-disable-next-line
  } else if (schemaPointer.type === `inline`) {
    return schemaPointer.value
  } else {
    return casesHandled(schemaPointer)
  }
}
