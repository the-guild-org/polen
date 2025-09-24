import ViteTsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [ViteTsconfigPaths() as any],
  test: {
    include: [`src/**/*.test.ts`],
    server: {
      deps: {
        inline: ['graphql-kit'],
        external: ['@effect/platform'],
      },
    },
  },
})
