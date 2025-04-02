import { defineConfig } from 'vite'
import { Pollen } from 'pollen'

const pollenPlugin = await Pollen.VitePlugin()

export default defineConfig({
  plugins: [
    ...pollenPlugin,
  ],
})
