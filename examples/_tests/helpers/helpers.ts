import { Url } from '#dep/url/index.js'
import { Path } from '@wollybeard/kit'
import { ExampleName } from './example-name.js'
import type { WorkerFixtures } from './test.js'

const selfPath = Path.parse(Url.fileURLToPath(import.meta.url))

const examplesDir = Path.resolve(selfPath.dir, `../../`)

export const getPaths = (importMeta: ImportMeta): {
  example: {
    name: ExampleName,
    dir: string,
  },
  examples: string,
} => {
  const testModulePath = Path.parse(Url.fileURLToPath(importMeta.url))
  const exampleName = ExampleName.parse(Path.basename(testModulePath.base, `.test.ts`))
  const exampleDir = Path.join(examplesDir, exampleName)
  return {
    examples: examplesDir,
    example: {
      name: exampleName,
      dir: exampleDir,
    },
  }
}

export const getFixtureOptions = (importMeta: ImportMeta): Pick<WorkerFixtures, `exampleName`> => {
  const paths = getPaths(importMeta)
  return {
    exampleName: paths.example.name,
  }
}
