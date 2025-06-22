import type { SelfContainedModeHooksData } from '#cli/_/self-contained-mode'
import { assertOptionalPathAbsolute, pickFirstPathExisting } from '#lib/kit-temp'
import { packagePaths } from '#package-paths'
import { debugPolen } from '#singletons/debug'
import type { Prom } from '@wollybeard/kit'
import { Path } from '@wollybeard/kit'
import * as Module from 'node:module'
import type { ConfigInput } from './configurator.ts'

export const fileNameBases = [`polen.config`, `.polen.config`]
export const fileNameExtensionsTypeScript = [`.ts`, `.js`, `.mjs`, `.mts`]
export const fileNameExtensionsJavaScript = [`.js`, `.mjs`]
export const fileNameExtensions = [...fileNameExtensionsTypeScript, ...fileNameExtensionsJavaScript]
export const fileNames = fileNameBases.flatMap(base => fileNameExtensions.map(ext => `${base}${ext}`))

export interface LoadOptions {
  dir: string
}

let isSelfContainedModeRegistered = false

export const load = async (options: LoadOptions): Promise<ConfigInput> => {
  const debug = debugPolen.sub(`load`)
  assertOptionalPathAbsolute(options.dir)

  //
  // ━━ Enable Self-Contained Mode
  //
  //  - When we're running CLI from source code
  //  - Do this BEFORE trying to load the config file
  //

  const isSelfContainedModeEnabled = packagePaths.isRunningFromSource
  if (isSelfContainedModeEnabled && !isSelfContainedModeRegistered) {
    const initializeData: SelfContainedModeHooksData = {
      projectDirPathExp: options.dir,
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

  const filePaths = fileNames.map(fileName => Path.join(options.dir, fileName))
  const filePath = await pickFirstPathExisting(filePaths)

  let configInput: ConfigInput | undefined = undefined
  if (!filePath) {
    configInput = {}
  } else {
    // If the user's config is a TypeScript file, we will use TSX to import it.
    // TODO: Use NodeJS's native ESM support for TypeScript files.

    let module: { default?: Prom.Maybe<ConfigInput>; config?: Prom.Maybe<ConfigInput> }
    if (fileNameExtensionsTypeScript.some(_ => filePath.endsWith(_))) {
      // @see https://tsx.is/dev-api/ts-import#usage
      const { tsImport } = await import(`tsx/esm/api`)
      // eslint-disable-next-line
      module = await tsImport(filePath, import.meta.url)
    } else {
      // eslint-disable-next-line
      module = await import(filePath)
    }
    debug(`imported config module`)

    //       // Use dynamic import with file URL to support Windows
    //       const configUrl = pathToFileURL(configPath).href

    // todo: report errors nicely if this fails
    const configInputFromFile = await (module.default ?? module.config)

    // todo: check schema of configInput

    // todo: report errors nicely
    if (!configInputFromFile) {
      throw new Error(
        `Your Polen config module (${filePath}) must export a config. You can use a default export or named export of \`config\`.`,
      )
    }
    configInput = configInputFromFile
  }

  //
  // ━━ Record Any Change of Self-Contained Mode
  //
  //  - This will enable a Vite plugin to handle polen imports from non-JS files
  //    in the user's project (like Markdown) in a self-contained way.

  if (isSelfContainedModeEnabled) {
    configInput.advanced ??= {}
    configInput.advanced.isSelfContainedMode = true
  }

  debug(`loaded config input`, configInput)

  return configInput
}
