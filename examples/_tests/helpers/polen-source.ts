export const PolenSource = {
  localLink: `localLink`,
  localFile: `localFile`,
  registry: `registry`,
} as const

export type PolenSource = (typeof PolenSource)[keyof typeof PolenSource]

export const parsePolenSource = (value: string): PolenSource => {
  if (value in PolenSource) return value as PolenSource
  throw new Error(`Invalid Polen source: ${value}`)
}
