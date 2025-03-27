import { createRouter } from './router/router'
import type { Server } from '../../lib/server/_namespace'
import { createStartHandler, defaultRenderHandler } from '@tanstack/react-start/server'
// import { getRouterManifest } from '@tanstack/react-start/router-manifest'

export const handler: Server.EntryManager.handler = createStartHandler({
  createRouter,
  // getRouterManifest,
})(defaultRenderHandler)
