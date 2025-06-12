import type { Plugin } from 'vite'

const log = console.log

export const BuildLogger: Plugin = {
  // https://rollupjs.org/plugin-development/#build-hooks
  name: `build-logger`,
  buildStart(...args) {
    log(`buildStart`, args)
  },
  resolveId(...args) {
    log(`resolveId`, args)
  },
  load(...args) {
    log(`load`, JSON.stringify(args))
  },
  shouldTransformCachedModule(...args) {
    log(`shouldTransformCachedModule`, args)
  },
  transform(...args) {
    log(`transform`, args)
    return args[0]
  },
  moduleParsed(...args) {
    log(`\nmoduleParsed`, args)
  },
  resolveDynamicImport(...args) {
    log(`resolveDynamicImport`, args)
  },
  buildEnd(...args) {
    log(`buildEnd`, args)
  },
}
