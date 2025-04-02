import * as Vite from 'vite'

export * from 'vite'

export const mergeRootConfig = (
  target: Vite.InlineConfig,
  source: Vite.InlineConfig,
): Vite.InlineConfig => Vite.mergeConfig(target, source)
