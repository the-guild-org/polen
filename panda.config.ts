import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/template/**/*.{ts,tsx}'],
  exclude: [],
  outdir: './src/template/styled-system',
  outExtension: 'js',
  forceConsistentTypeExtension: true,
  jsxFramework: 'react',
  gitignore: false,
})
