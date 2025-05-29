import type { Plugin } from 'vite'

export const BuildLogger: Plugin = {
  // https://rollupjs.org/plugin-development/#build-hooks
  name: `build-logger`,
  buildStart(...args) {
    console.log(`buildStart`, args)
  },
  resolveId(...args) {
    console.log(`resolveId`, args)
  },
  load(...args) {
    console.log(`load`, JSON.stringify(args))
  },
  shouldTransformCachedModule(...args) {
    console.log(`shouldTransformCachedModule`, args)
  },
  transform(...args) {
    console.log(`transform`, args)
    return args[0]
  },
  moduleParsed(...args) {
    console.log(`\nmoduleParsed`, args)
  },
  resolveDynamicImport(...args) {
    console.log(`resolveDynamicImport`, args)
  },
  buildEnd(...args) {
    console.log(`buildEnd`, args)
  },
}
