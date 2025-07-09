import type { Config } from '#api/config/index'
import { createPolenState } from '#api/vite/state/index'
import { VitePluginSelfContainedMode } from '#cli/_/self-contained-mode'
import type { Vite } from '#dep/vite/index'
import { VitePluginJson } from '#lib/vite-plugin-json/index'
import { reactRouter } from '#lib/vite-plugin-react-router/plugin'
import { VitePluginReactiveData } from '#lib/vite-plugin-reactive-data/index'
import { superjson } from '#singletons/superjson'
import ViteReact from '@vitejs/plugin-react-oxc'
import rsc from '@vitejs/plugin-rsc'
import Inspect from 'vite-plugin-inspect'
import { Branding } from './branding.js'
import { Core } from './core.js'
import { Pages } from './pages.js'
import { SchemaPlugin } from './schema.js'

const superjsonVitePlugin = VitePluginJson.create({
  codec: {
    validate: superjson,
    importPath: import.meta.resolve(`#singletons/superjson`),
    importExport: `superjson`,
  },
  filter: {
    moduleTypes: [`jsonsuper`],
  },
})

export const Main = (
  config: Config.Config,
): Vite.PluginOption => {
  const plugins: Vite.PluginOption = []
  const state = createPolenState()

  plugins.push(
    ViteReact(),
    Pages({ config, state }), // Add Pages before React Router
    SchemaPlugin({ config, state }), // Add Schema plugin
    superjsonVitePlugin,
    VitePluginReactiveData.create({
      moduleId: `virtual:polen/project/data/navbar.jsonsuper`,
      codec: superjson,
      data: state.navbar.value,
      name: `polen-navbar`,
    }),
    reactRouter({
      appDirectory: config.paths.framework.template.absolute.rootDir,
    }),
    rsc({}),
    Branding({ config }),
    Core({ config }),
    Inspect(),
  )

  // Note: The main use for this right now is to resolve the react imports
  // from the mdx vite plugin which have to go through the Polen exports since Polen keeps those deps bundled.
  //
  // If we manage to get the mdx vite plugin that defers JSX transform to Rolldown then we can remove this!
  //
  if (config.advanced.isSelfContainedMode) {
    plugins.push(VitePluginSelfContainedMode({
      projectDirPathExp: config.paths.project.rootDir,
    }))
  }

  // Add RSC SSG plugin for SSG builds
  // TODO: Fix RSC SSG plugin to work with RSC plugin output
  // if (config.build.architecture === 'ssg') {
  //   plugins.push(RscSsgPlugin(config))
  // }

  return plugins
}
