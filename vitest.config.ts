import ViteTsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [ViteTsconfigPaths()],
  test: {
    include: [`src/**/*.test.ts`],
  },
})
