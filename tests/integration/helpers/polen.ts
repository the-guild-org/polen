import { Api } from '#api/$'
import { Ef } from '#dep/effect'
import type { Vite } from '#dep/vite/index'
import type { Polen } from '#exports/index'
import { toViteUserConfig } from '#vite/config'
import { NodeFileSystem } from '@effect/platform-node'
import { FsLoc } from '@wollybeard/kit'

export const defaultViteConfig: Vite.UserConfig = {
  // Don't override Polen's custom logger which already filters optimization messages
  // customLogger: Vite.createLogger(`silent`, {}),
}

export const pc = async (configInput?: Polen.ConfigInput, baseRootDirPath?: string | FsLoc.AbsDir) => {
  // Convert FsLoc to string if needed
  const rootDirPath = typeof baseRootDirPath === 'string'
    ? baseRootDirPath
    : baseRootDirPath
    ? FsLoc.encodeSync(baseRootDirPath)
    : undefined

  const polenConfig = await Ef.runPromise(
    Api.ConfigResolver.fromMemory({
      advanced: {
        vite: {
          ...defaultViteConfig,
          ...configInput?.advanced?.vite,
        },
      },
      ...configInput,
    }, rootDirPath ? FsLoc.decode(rootDirPath) as FsLoc.AbsDir : undefined).pipe(
      Ef.provide(NodeFileSystem.layer),
    ),
  )
  return toViteUserConfig(polenConfig)
}

export const configMemorySchema = (sdl: string): Polen.ConfigInput[`schema`] => {
  return {
    useSources: `memory`,
    sources: {
      memory: {
        revisions: [sdl],
      },
    },
  }
}

export const configMemorySchemaRevisions = (
  revisions: { date: Date; sdl: string }[],
): Polen.ConfigInput[`schema`] => {
  return {
    useSources: `memory`,
    sources: {
      memory: {
        revisions: revisions.map(revision => ({
          date: revision.date,
          value: revision.sdl,
        })),
      },
    },
  }
}
