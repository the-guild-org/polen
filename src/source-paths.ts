import { Path } from '@wollybeard/kit'
import packageJson from '../package.json' with { type: 'json' }
import { resolve } from 'resolve.imports'

export interface SourcePaths {
  dir: string
  template: {
    dir: string,
    modulePaths: {
      entryServer: string,
      entryClient: string,
    },
  }
}

const srcDir = import.meta.dirname
const templateDir = Path.join(srcDir, `./template`)

export const sourcePaths: SourcePaths = {
  dir: srcDir,
  template: {
    dir: templateDir,
    modulePaths: {
      entryServer: Path.join(templateDir, `entry.server.jsx`),
      entryClient: Path.join(templateDir, `entry.client.jsx`),
    },
  },
}

const isSrc = import.meta.filename.endsWith(`.ts`)

export const resolveLocalImport = (id: string): string | null => {
  if (!id.startsWith(`#`)) return null

  let resolvedLocalImport = resolve(
    {
      content: {
        imports: packageJson.imports,
      },
    },
    id,
    // {
    //   conditions: [`source`],
    // },
  )

  if (!resolvedLocalImport) return null

  if (isSrc) {
    resolvedLocalImport = resolvedLocalImport
      .replace(`/build/`, `/src/`)
      .replace(`.js`, `.ts`)
      .replace(`.jsx`, `.tsx`)
    resolvedLocalImport = Path.join(sourcePaths.dir, `..`, resolvedLocalImport)
  }

  return resolvedLocalImport
}
