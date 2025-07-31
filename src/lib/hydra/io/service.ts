// Re-export CrudService as IO for backward compatibility with Hydra Bridge
export { CrudService as IO, CrudService as IOService } from '#lib/services-crud/service'

// Re-export services-crud functions for backward compatibility
export { fromFileSystem as File } from '#lib/services-crud/filesystem'
export { memory as Memory } from '#lib/services-crud/memory'
export type { MemoryOptions } from '#lib/services-crud/memory'
