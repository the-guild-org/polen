import type { SelfContainedModeHooksData } from '#cli/_/self-contained-mode'
import { Ef, Op, S } from '#dep/effect'
import { packagePaths } from '#package-paths'
import { debugPolen } from '#singletons/debug'
import { FileSystem } from '@effect/platform/FileSystem'
import { Fs, FsLoc, Prom } from '@wollybeard/kit'
import { ParseResult } from 'effect'
import * as Module from 'node:module'
import type { WritableDeep } from 'type-fest'
import type { ConfigInput } from './input.js'
import { validateConfigInput, validateConfigInputEffect } from './input.js'

export const fileNameBases = [`polen.config`, `.polen.config`]
export const fileNameExtensionsTypeScript = [`.ts`, `.js`, `.mjs`, `.mts`]
export const fileNameExtensionsJavaScript = [`.js`, `.mjs`]
export const fileNameExtensions = [...fileNameExtensionsTypeScript, ...fileNameExtensionsJavaScript]
export const fileNames = fileNameBases.flatMap(base => fileNameExtensions.map(ext => `${base}${ext}`))

export interface LoadOptions {
  dir: FsLoc.AbsDir
}

let isSelfContainedModeRegistered = false

export const load = (options: LoadOptions): Ef.Effect<ConfigInput, Error, FileSystem> =>
  Ef.gen(function*() {
    const debug = debugPolen.sub(`load`)
    const dirStr = FsLoc.encodeSync(options.dir)

    //
    // ━━ Enable Self-Contained Mode
    //
    //  - When we're running CLI from source code
    //  - Do this BEFORE trying to load the config file
    //

    const isSelfContainedModeEnabled = packagePaths.isRunningFromSource
    if (isSelfContainedModeEnabled && !isSelfContainedModeRegistered) {
      const initializeData: SelfContainedModeHooksData = {
        projectDirPathExp: dirStr,
      }
      debug(`register node module hooks`, { data: initializeData })
      // TODO: would be simpler to use sync hooks
      // https://nodejs.org/api/module.html#synchronous-hooks-accepted-by-moduleregisterhooks
      // Requires NodeJS 22.15+ -- which is not working with PW until its next release.
      Module.register(`#cli/_/self-contained-mode`, import.meta.url, { data: initializeData })
      isSelfContainedModeRegistered = true
    }

    //
    // ━━ Fetch the Config
    //

    const fileRelPaths = fileNames.map(fileName => S.decodeSync(FsLoc.RelFile.String)(fileName))
    const filePathOption = yield* Fs.findFirstUnderDir(options.dir)(fileRelPaths)

    let configInput: ConfigInput
    const filePath = Op.getOrUndefined(filePathOption)
    if (!filePath) {
      // No config file found, use empty config (will use all defaults)
      configInput = validateConfigInput({})
    } else {
      // If the user's config is a TypeScript file, we will use TSX to import it.

      const module = yield* Ef.tryPromise({
        try: async () => {
          const filePathStr = FsLoc.encodeSync(filePath)
          if (fileNameExtensionsTypeScript.some(_ => filePathStr.endsWith(_))) {
            // @see https://tsx.is/dev-api/ts-import#usage
            const { tsImport } = await import(`tsx/esm/api`)
            return await tsImport(filePathStr, import.meta.url) as {
              default?: Prom.Maybe<ConfigInput>
              config?: Prom.Maybe<ConfigInput>
            }
          } else {
            return await import(filePathStr) as { default?: Prom.Maybe<ConfigInput>; config?: Prom.Maybe<ConfigInput> }
          }
        },
        catch: (error) => new Error(`Failed to import config module from ${FsLoc.encodeSync(filePath)}: ${error}`),
      })
      debug(`imported config module`)

      //       // Use dynamic import with file URL to support Windows
      //       const configUrl = pathToFileURL(configPath).href

      const configInputFromFile = yield* Ef.tryPromise({
        try: async () => await (module.default ?? module.config),
        catch: (error) => new Error(`Failed to resolve config from module: ${error}`),
      })

      if (!configInputFromFile) {
        return yield* Ef.fail(
          new Error(
            `Your Polen config module (${filePath}) must export a config. You can use a default export or named export of \`config\`.`,
          ),
        )
      }

      // Validate the config against the schema using Effect
      configInput = yield* validateConfigInputEffect(configInputFromFile).pipe(
        Ef.mapError((parseError) =>
          new Error(
            `Invalid Polen configuration in ${filePath}:\n${ParseResult.TreeFormatter.formatErrorSync(parseError)}`,
          )
        ),
      )
    }

    //
    // ━━ Record Any Change of Self-Contained Mode
    //
    //  - This will enable a Vite plugin to handle polen imports from non-JS files
    //    in the user's project (like Markdown) in a self-contained way.

    if (isSelfContainedModeEnabled) {
      const configInput_as_writable = configInput as WritableDeep<ConfigInput>
      configInput_as_writable.advanced ??= {}
      configInput_as_writable.advanced.isSelfContainedMode = true
    }

    debug(`loaded config input`, configInput)

    return configInput
  })
