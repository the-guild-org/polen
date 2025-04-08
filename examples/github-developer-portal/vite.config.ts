import { defineConfig } from 'vite'
import { Polen } from 'polen'

export default defineConfig({
  plugins: [Polen.VitePlugin({
    templateVariables: {
      title: `GitHub GraphQL API`,
    },
  })],
})
