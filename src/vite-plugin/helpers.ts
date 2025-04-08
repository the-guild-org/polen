import { Vite } from '../lib/vite/_namespace.js'

export const vi = Vite.VirtualIdentifier.createFactory({ namespace: `polen` })
export const viExternal = Vite.VirtualIdentifier.createFactory({ idPrefix: `polen:` })
