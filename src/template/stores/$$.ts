export * as Schema from './schema.js'
export { store as schema } from './schema.js'

export * as Toast from './toast.js'
export { store as toast } from './toast.js'

export * as Changelog from './changelog.js'
export { store as changelog } from './changelog.js'

export interface Store {
  reset: () => void
  set: (data?: unknown) => void
}

export interface StoreModule {
  store: Store
  initialState: unknown
}
