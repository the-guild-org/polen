import { defineConfig } from 'vitest/config'
import ViteTsconfigPaths from'vite-tsconfig-paths'

export default defineConfig({
  plugins:[ViteTsconfigPaths()],
  test: {
    include: [`src/**/*.test.ts`],
  },
})
