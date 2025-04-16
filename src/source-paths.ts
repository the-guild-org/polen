import { Path } from './lib/path/_namespace.js'

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
const templateDir = Path.join(srcDir, `./app-template`)

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
