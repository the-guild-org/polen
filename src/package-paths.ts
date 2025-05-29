import { Path } from '@wollybeard/kit'

export interface PackagePaths {
  rootDir: string
  sourceDir: string
  template: {
    rootDir: string
    server: {
      app: string
      entrypoint: string
    }
    client: {
      entrypoint: string
    }
  }
}

/**
 * Usually ./build but if running with tsx then ./src
 */
const sourceDir = import.meta.dirname
const templateDir = Path.join(sourceDir, `template`)
const rootDir = Path.join(sourceDir, `..`)

export const packagePaths: PackagePaths = {
  rootDir: rootDir,
  sourceDir,
  template: {
    rootDir: templateDir,
    server: {
      app: Path.join(templateDir, `server/app.js`),
      entrypoint: Path.join(templateDir, `server/main.js`),
    },
    client: {
      entrypoint: Path.join(templateDir, `entry.client.jsx`),
    },
  },
}
