import ViteTsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [ViteTsconfigPaths() as any], // TODO: Remove when vitest supports rolldown-vite
  test: {
    include: [`src/**/*.test.ts`],
  },
})
