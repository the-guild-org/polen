import { type ImportEvent, isSpecifierFromPackage } from '#lib/kit-temp.ts'
import { packagePaths } from '#package-paths.ts'
import { debug } from '#singletons/debug.ts'
import type * as Module from 'node:module'

export interface SelfContainedModeHooksData {
  projectDirPathExp: string
}

let data_: SelfContainedModeHooksData | undefined = undefined

export function initialize(data: SelfContainedModeHooksData) {
  data_ = data
}

export const resolve: Module.ResolveHook = async (specifier, context, nextResolve) => {
  if (!data_) throw new Error(`Self-contained mode not initialized`)

  const _debug = debug.sub(`node-module-hooks`)

  const from: ImportEvent = {
    specifier,
    context,
  }

  if (
    from.context.parentURL && checkIsSelfContainedImport({
      projectDirPathExp: data_.projectDirPathExp,
      specifier,
      importer: from.context.parentURL,
    })
  ) {
    _debug(`resolve check`, { specifier, context })

    const to: ImportEvent = {
      specifier: from.specifier,
      context: {
        conditions: [...from.context.conditions, `source`],
        parentURL: import.meta.url,
        importAttributes: from.context.importAttributes,
      },
    }

    _debug(`resolve`, { from, to })

    await nextResolve(to.specifier, to.context)
  }

  return nextResolve(specifier, context)
}

export const checkIsSelfContainedImport = (input: {
  specifier: string
  importer: string
  projectDirPathExp: string
}): boolean => {
  // Not clear it would ever not be the case but we're being careful here.
  // ...would be intersted to know if this is ever false.
  const isImporterTheProject = input.importer.includes(input.projectDirPathExp)

  const isImportMe = isSpecifierFromPackage(input.specifier, packagePaths.name)

  return isImporterTheProject && isImportMe
}
