import { Path } from '#dep/path/index.js'

export interface SourcePaths {
  isTypeScript: boolean
  dir: string
  template: {
    dir: string,
    modulePaths: {
      entryServer: string,
      entryClient: string,
    },
  }
}

const isTypeScript = import.meta.filename.endsWith(`.ts`)
const srcDir = import.meta.dirname
const templateDir = Path.join(srcDir, `./template`)

export const sourcePaths: SourcePaths = {
  isTypeScript,
  dir: srcDir,
  template: {
    dir: templateDir,
    modulePaths: {
      entryServer: Path.join(templateDir, `entry.server.jsx`),
      entryClient: Path.join(templateDir, `entry.client.jsx`),
    },
  },
}
