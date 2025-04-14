import { Fs } from '../lib/fs/_namespace.js'
import { casesHandled } from '../lib/prelude/main.js'

export interface SchemaPointerFile {
  type: `file`
  path: string
}

export interface SchemaPointerInline {
  type: `inline`
  value: string
}

export type SchemaPointer = SchemaPointerFile | SchemaPointerInline

export const readSchemaPointer = async (schemaPointer: SchemaPointer): Promise<string> => {
  if (schemaPointer.type === `file`) {
    return Fs.readFile(schemaPointer.path, `utf-8`)
    // eslint-disable-next-line
  } else if (schemaPointer.type === `inline`) {
    return schemaPointer.value
  } else {
    return casesHandled(schemaPointer)
  }
}
