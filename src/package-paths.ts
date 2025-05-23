import { Path } from '@wollybeard/kit'
// import { resolve } from 'resolve.imports'
// import packageJson from '../package.json' with { type: 'json' }

export interface PackagePaths {
  node_modules: string
  dir: string
  sourceDir: string
  template: {
    dir: string
    modulePaths: {
      entryServer: string
      entryClient: string
    }
  }
}

const rootDir = Path.join(import.meta.dirname, `..`)
const srcDir = Path.join(rootDir, `src`)
const templateDir = Path.join(srcDir, `template`)

export const packagePaths: PackagePaths = {
  node_modules: Path.join(rootDir, `node_modules`),
  dir: rootDir,
  sourceDir: srcDir,
  template: {
    dir: templateDir,
    modulePaths: {
      entryServer: Path.join(templateDir, `entry.server.jsx`),
      entryClient: Path.join(templateDir, `entry.client.jsx`),
    },
  },
}

// const isSrc = import.meta.filename.endsWith(`.ts`)

// export const resolveLocalImport = (id: string): string | null => {
//   if (!id.startsWith(`#`)) return null

//   let resolvedLocalImport = resolve(
//     {
//       content: {
//         imports: packageJson.imports,
//       },
//     },
//     id,
//     // {
//     //   conditions: [`source`],
//     // },
//   )

//   if (!resolvedLocalImport) return null

//   if (isSrc) {
//     resolvedLocalImport = resolvedLocalImport
//       .replace(`/build/`, `/src/`)
//       .replace(`.js`, `.ts`)
//       .replace(`.jsx`, `.tsx`)
//     resolvedLocalImport = Path.join(packagePaths.sourceDir, `..`, resolvedLocalImport)
//   }

//   return resolvedLocalImport
// }
