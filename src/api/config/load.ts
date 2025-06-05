import { assertOptionalPathAbsolute, pickFirstPathExisting } from '#lib/kit-temp.js'
import type { Prom } from '@wollybeard/kit'
import { Path } from '@wollybeard/kit'
import type { ConfigInput } from './configurator.js'

export const fileNameBases = [`polen.config`, `.polen.config`]
export const fileNameExtensionsTypeScript = [`.ts`, `.js`, `.mjs`, `.mts`]
export const fileNameExtensionsJavaScript = [`.js`, `.mjs`]
export const fileNameExtensions = [...fileNameExtensionsTypeScript, ...fileNameExtensionsJavaScript]
export const fileNames = fileNameBases.flatMap(base => fileNameExtensions.map(ext => `${base}${ext}`))

export interface LoadOptions {
  dir: string
}

export const load = async (options: LoadOptions): Promise<ConfigInput> => {
  assertOptionalPathAbsolute(options.dir)

  const filePaths = fileNames.map(fileName => Path.join(options.dir, fileName))
  const filePath = await pickFirstPathExisting(filePaths)

  if (!filePath) return {}

  let module: { default?: Prom.Maybe<ConfigInput>; config?: Prom.Maybe<ConfigInput> }

  if (fileNameExtensionsTypeScript.some(_ => filePath.endsWith(_))) {
    // @see https://tsx.is/dev-api/ts-import#usage
    const { tsImport } = await import(`tsx/esm/api`)
    module = await tsImport(filePath, import.meta.url)
  } else {
    module = await import(filePath)
  }

  //       // Use dynamic import with file URL to support Windows
  //       const configUrl = pathToFileURL(configPath).href

  // todo: report errors nicely if this fails
  const configInput = await (module.default ?? module.config)

  // todo: check schema of configInput

  // todo: report errors nicely
  if (!configInput) {
    throw new Error(
      `Your Polen config module (${filePath}) must export a config. You can use a default export or named export of \`config\`.`,
    )
  }

  return configInput
}
