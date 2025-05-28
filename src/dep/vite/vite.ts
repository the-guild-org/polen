import * as Vite from 'vite'

type AnyFunction = (...args: any[]) => any

export type HookLoadFn = Extract<Vite.Plugin[`load`], AnyFunction>
export type HookLoadFnPure = OmitThisParameter<HookLoadFn>

export type HookResolveIdFn = Extract<Vite.Plugin[`resolveId`], AnyFunction>
export type HookResolveIdFnPure = OmitThisParameter<HookResolveIdFn>

export type PartialEnvironment = Parameters<
  Exclude<Vite.Plugin[`applyToEnvironment`], undefined>
>[0]

export * from 'vite'

export const defaultPort = 5173

export const mergeRootConfig = (
  target: Vite.InlineConfig,
  source: Vite.InlineConfig,
): Vite.InlineConfig => Vite.mergeConfig(target, source)

export const EnvironmentName = {
  client: `client`,
  ssr: `ssr`,
}

export const isEnvironmentSsr = (environment: PartialEnvironment): boolean => {
  return environment.name === EnvironmentName.ssr
}

export const isEnvironmentClient = (environment: PartialEnvironment): boolean =>
  environment.name === EnvironmentName.client

export const ModeName = {
  build: `build`,
  development: `development`,
}

export const CommandName = {
  serve: `serve`,
  build: `build`,
}

export const LogCodeEnum = {
  MODULE_LEVEL_DIRECTIVE: `MODULE_LEVEL_DIRECTIVE`,
  CIRCULAR_DEPENDENCY: `CIRCULAR_DEPENDENCY`,
  UNUSED_EXTERNAL_IMPORT: `UNUSED_EXTERNAL_IMPORT`,
}
