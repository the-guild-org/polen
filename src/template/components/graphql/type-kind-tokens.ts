import type { Grafaid } from 'graphql-kit'

interface TypeKindTokens {
  symbol: string
  color: string
}

// Create a partial index with known types
const knownTypeKinds = {
  // Output types
  Object: { symbol: `O`, color: `primary` },
  Interface: { symbol: `T`, color: `accent` },
  Union: { symbol: `U`, color: `accent` },
  // Input/Output types
  Enum: { symbol: `E`, color: `destructive` },
  Scalar: { symbol: `S`, color: `destructive` },
  // Input types
  InputObject: { symbol: `I`, color: `muted` },
  // Modifiers
  List: { symbol: `L`, color: `muted` },
  NonNull: { symbol: `N`, color: `muted` },
} satisfies Partial<Record<Grafaid.Schema.TypeKindName, TypeKindTokens>>

export const unknownTypeKindToken: TypeKindTokens = {
  symbol: `?`,
  color: `muted`,
}

// Create a type-safe index with fallback
export const typeKindTokensIndex = new Proxy(knownTypeKinds, {
  get(target, prop: string) {
    return target[prop as keyof typeof target] ?? unknownTypeKindToken
  },
}) as Record<Grafaid.Schema.TypeKindName, TypeKindTokens>
