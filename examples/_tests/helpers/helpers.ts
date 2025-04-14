import { Path } from '../../../src/lib/path/_namespace.js'
import { Url } from '../../../src/lib/url/_namespace.js'
import type { Fixtures } from './test.js'

const selfPath = Path.parse(Url.fileURLToPath(import.meta.url))

const examplesDir = Path.resolve(selfPath.dir, `../../`)

export const getPaths = (importMeta: ImportMeta): {
  example: {
    name: string,
    dir: string,
  },
  examples: string,
} => {
  const testModulePath = Path.parse(Url.fileURLToPath(importMeta.url))
  const exampleName = Path.basename(testModulePath.base, `.test.ts`)
  const exampleDir = Path.join(examplesDir, exampleName)
  return {
    examples: examplesDir,
    example: {
      name: exampleName,
      dir: exampleDir,
    },
  }
}

export const getFixtureOptions = (importMeta: ImportMeta): Pick<Fixtures, `cwd`> => {
  const paths = getPaths(importMeta)
  return {
    cwd: paths.example.dir,
  }
}
