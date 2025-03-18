import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as Path from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  preview: {
    port: 5173
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'graphql-vendor': ['graphql']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': Path.resolve(__dirname, './src')
    }
  }
})
