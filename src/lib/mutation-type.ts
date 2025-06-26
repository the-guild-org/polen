export const MutationType = {
  Create: `create`,
  Update: `update`,
  Delete: `delete`,
} as const

export type MutationType = typeof MutationType[keyof typeof MutationType]

export type ExistenceDiff =
  | { before: false; after: true } // Create
  | { before: true; after: true } // Update
  | { before: true; after: false } // Delete

export const getMutationType = (diff: ExistenceDiff): MutationType => {
  if (!diff.before && diff.after) return MutationType.Create
  if (diff.before && diff.after) return MutationType.Update
  if (diff.before && !diff.after) return MutationType.Delete
  // TypeScript ensures we handle all cases exhaustively
  throw new Error(`Invalid existence diff: ${JSON.stringify(diff)}`)
}
