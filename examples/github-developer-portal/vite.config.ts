import { defineConfig } from 'vite'
import { Polen } from 'polen'

export default defineConfig(({ isSsrBuild }) => {
  const polenPlugin = Polen.VitePlugin({
    mode: isSsrBuild ? `server` : `client`,
  })

  return {
    plugins: [
      ...polenPlugin,
    ],
  }
})
