import type { Vite } from '#dep/vite/index.js'
// import ViteReact from '@vitejs/plugin-react-swc'
// import ViteReact from '#lib/vite-react/vite-react.js'
import { Arr } from '@wollybeard/kit'
import Inspect from 'vite-plugin-inspect'
import Restart from 'vite-plugin-restart'
import type { Configurator } from '../../configurator/index.js'

export const Main = (
  config: Configurator.Config,
): Vite.PluginOption => {
  const plugins: Vite.PluginOption = []

  // Optional Plugins based on config

  if (config.explorer) {
    const plugin = Inspect({
      build: true,
      outputDir: `./.bundle-explorer`,
    })
    plugins.push(plugin)
  }

  if (Arr.isNotEmpty(config.watch.also)) {
    const plugin = Restart({
      restart: config.watch.also,
    })
    plugins.push(plugin)
  }

  // const resolve = (importSpecifier: string) => {
  //   const fileUrl = import.meta.resolve(importSpecifier)
  //   const filePath = Path.fromFileUrl(fileUrl)
  //   return filePath
  // }

  plugins.push() // {
  //   name: `debug`,
  //   resolveId(id, importer) {
  //     console.log({ id, importer })
  //     if (id === `a`) return `a`
  //     return undefined
  //   },
  //   load(id) {
  //     if (id === `a`) {
  //       return `import * as X from "polen/react/jsx-dev-runtime"; console.log(X)`
  //     }
  //     return undefined
  //   },
  // },
  // ConfigPlugin({
  //   resolve: {
  //     alias: [
  //       {
  //         find: `polen/react`,
  //         replacement: `react`,
  //       },
  //       {
  //         find: `polen/react-dom/server`,
  //         replacement: `react-dom/server`,
  //       },
  //       {
  //         find: `polen/react/jsx-dev-runtime`,
  //         replacement: `react/jsx-dev-runtime`,
  //         // customResolver(source, importer, options) {
  //         //   // console.log({ source, importer, options }, packagePaths.dir)
  //         //   if (importer?.includes(packagePaths.dir)) {
  //         //     const path = Path.fromFileUrl(import.meta.resolve(`react/jsx-dev-runtime`))
  //         //     // console.log(`polen internal import`, path)
  //         //     return path
  //         //   }
  //         //   return this.resolve(source, importer, options)
  //         // },
  //       },
  //       // 'react-dom/server': resolve(`react-dom/server`),
  //       // 'react-dom': resolve(`react-dom`),
  //       // 'react/jsx-dev-runtime': `polen/react/jsx-dev-runtime`,
  //       // 'react/jsx-runtime': resolve(`react/jsx-runtime`),
  //       // 'react': resolve(`react`),
  //     ],
  //   },
  //   optimizeDeps: {
  //     // esbuildOptions: { jsx: `automatic` },
  //     force: true,
  //     exclude: [],
  //     include: [
  //       // `react-dom`,
  //       // `react`,
  //       `react`,
  //       `react-dom/server`,
  //       `react/jsx-dev-runtime`,
  //       // `polen/react/jsx-dev-runtime`,
  //       // `react/jsx-runtime`,
  //       // resolve(`react`),
  //       // resolve(`react/jsx-dev-runtime`),
  //       // resolve(`react/jsx-runtime`),
  //     ],
  //   },
  //   ssr: {
  //     optimizeDeps: {
  //       exclude: [],
  //       include: [
  //         `react`,
  //         `react/jsx-dev-runtime`,
  //         `react-dom/server`,
  //         // `polen/react/jsx-dev-runtime`,
  //         // resolve(`react/jsx-dev-runtime`),
  //       ],
  //     },
  //     external: [],
  //     noExternal: [
  //       `react`,
  //       `react/jsx-dev-runtime`,
  //       `react-dom/server`,
  //       // `polen/react/jsx-dev-runtime`,
  //       // resolve(`react/jsx-dev-runtime`),
  //       // `react-dom/server`,
  //       // `react/jsx-runtime`,
  //     ],
  //   },
  // }),
  // React resolver needs to run first to ensure proper module resolution
  // reactImportResolver,
  // Virtual JSX handler injects React imports
  // virtualJsxHandler,
  // Vite React plugin handles JSX transformation
  // ViteReact(),
  // Core(config),
  // Serve({
  //   entryServer: config.paths.appTemplate.entryServer,
  // }),
  // Build({
  //   entryServerPath: config.paths.appTemplate.entryServer,
  //   clientEntryPath: config.paths.appTemplate.entryClient,
  //   debug: true,
  // }),

  return plugins
}
