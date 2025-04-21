import type { FSJetpack } from 'fs-jetpack/types.js'
import { DirectoryLayout } from './directory-layout.js'

export namespace FileStorage {
  export interface FileStorage {
    utilities: FSJetpack
    cwd: string
    set: <directoryLayout extends DirectoryLayout.Tree>(
      directoryLayout: directoryLayout,
    ) => Promise<directoryLayout>
  }

  export const create = (parameters: { jetpack: FSJetpack }): FileStorage => {
    const fsj = parameters.jetpack

    return {
      utilities: fsj,
      cwd: fsj.cwd(),
      set: async directoryLayout => {
        const flat = DirectoryLayout.normalizeToFlat(directoryLayout)
        const entries = Object.entries(flat)
        await Promise.all(entries.map(async ([path, content]) => {
          await fsj.writeAsync(path, content)
        }))

        const tree = DirectoryLayout.normalizeToTree(directoryLayout)
        return tree as any
      },
    }
  }
}
