import type { Vite } from '#dep/vite/index'
import { type ImportEvent, isSpecifierFromPackage } from '#lib/kit-temp'
import { packagePaths } from '#package-paths'
import { debugPolen } from '#singletons/debug'
import type * as Module from 'node:module'
import { fileURLToPath } from 'node:url'

export interface SelfContainedModeHooksData {
  projectDirPathExp: string
}

let data_: SelfContainedModeHooksData | undefined = undefined

export function initialize(data: SelfContainedModeHooksData) {
  data_ = data
}

export const resolve: Module.ResolveHook = async (specifier, context, nextResolve) => {
  if (!data_) throw new Error(`Self-contained mode not initialized`)

  const debug = debugPolen.sub(`node-module-hooks`)

  const from: ImportEvent = {
    specifier,
    context,
  }

  if (
    from.context.parentURL && checkIsSelfImportFromProject({
      projectDirPathExp: data_.projectDirPathExp,
      specifier,
      importerPathExpOrFileUrlExp: from.context.parentURL,
    })
  ) {
    debug(`resolve check`, { specifier, context })

    const to: ImportEvent = {
      specifier: from.specifier,
      context: {
        conditions: [...from.context.conditions, `source`],
        parentURL: import.meta.url,
        importAttributes: from.context.importAttributes,
      },
    }

    debug(`resolve`, { from, to })

    await nextResolve(to.specifier, to.context)
  }

  return nextResolve(specifier, context)
}

export const checkIsSelfImportFromProject = (input: {
  specifier: string
  importerPathExpOrFileUrlExp: string
  projectDirPathExp: string
}): boolean => {
  // Not clear it would ever not be the case but we're being careful here.
  // ...would be intersted to know if this is ever false.
  const isImporterTheProject = input.importerPathExpOrFileUrlExp.includes(input.projectDirPathExp)

  const isImportMe = isSpecifierFromPackage(input.specifier, packagePaths.name)

  return isImporterTheProject && isImportMe
}

export const VitePluginSelfContainedMode = ({ projectDirPathExp }: { projectDirPathExp: string }): Vite.Plugin => {
  const d = debugPolen.sub(`vite-plugin:self-contained-import`)

  return {
    name: `polen:self-contained-import`,
    resolveId(id, importer) {
      const isSelfContainedImport = importer
        && checkIsSelfImportFromProject({ projectDirPathExp, specifier: id, importerPathExpOrFileUrlExp: importer })
      if (!isSelfContainedImport) return

      const to = fileURLToPath(import.meta.resolve(id))

      d(`did resolve`, { from: id, to })

      return to
    },
  }
}