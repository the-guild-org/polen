import { Vite } from '#dep/vite/index'

export const isKitUnusedExternalImport = (
  message: Vite.Rollup.RollupLog,
) => {
  return (
    message.code === Vite.LogCodeEnum.UNUSED_EXTERNAL_IMPORT
    && message.exporter === `node:path`
    && message.ids?.some(id => id.includes(`/kit/`))
  )
}

export const isRadixModuleLevelDirective = (
  message: Vite.Rollup.RollupLog,
) => {
  return (
    message.code === Vite.LogCodeEnum.MODULE_LEVEL_DIRECTIVE
    && message.id?.includes(`@radix-ui`)
  )
}
