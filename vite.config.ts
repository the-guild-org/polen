import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as Path from 'node:path'

export default defineConfig({
  plugins: [react()],
  root: './src/app',
  publicDir: './src/app/public',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'graphql-vendor': ['graphql'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@app': Path.resolve(__dirname, './src/app'),
    },
  },
})
