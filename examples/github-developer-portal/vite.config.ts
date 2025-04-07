import type { PluginOption } from 'vite'
import { defineConfig } from 'vite'
import { Polen } from 'polen'

export default defineConfig({
  plugins: [
    Polen.VitePlugin() as PluginOption,
  ],
})
