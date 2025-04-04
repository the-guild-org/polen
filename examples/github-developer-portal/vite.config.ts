import { defineConfig } from 'vite'
import { Pollen } from 'pollen'

export default defineConfig(({ isSsrBuild }) => {
  const pollenPlugin = Pollen.VitePlugin({
    mode: isSsrBuild ? `server` : `client`,
  })

  return {
    plugins: [
      ...pollenPlugin,
    ],
  }
})
