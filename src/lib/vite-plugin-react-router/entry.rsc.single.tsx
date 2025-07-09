import { fetchServer } from './entry.rsc.js'

export default async function handler(requrest: Request): Promise<Response> {
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import('./entry.ssr.js')
  >('ssr', 'index')
  return ssr.default(requrest, fetchServer)
}
