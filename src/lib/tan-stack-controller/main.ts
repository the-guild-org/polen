import { defineConfig } from '@tanstack/react-start/config'
import * as Path from 'node:path'
import tsConfigPaths from 'vite-tsconfig-paths'

export const createApp = (parameters: {
  rootDirectory: string,
}) => {
  const { rootDirectory } = parameters
  const appDirectory = Path.join(rootDirectory, `app`)
  const publicDirectory = Path.join(rootDirectory, `public`)

  return defineConfig({
    tsr: {
      appDirectory,
    },
    routers: {
      public: {
        dir: publicDirectory,
      },
    },
    server: {
      prerender: {
        routes: [`/`],
        crawlLinks: true,
      },
    },
    vite: {
      plugins: [
        tsConfigPaths({
          projects: [`./tsconfig.json`],
        }),
      ],
    },
  })
}
