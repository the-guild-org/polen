import type { colorPropDef } from '@radix-ui/themes/props'
import type { Grafaid } from 'graphql-kit'

type RadixColor = typeof colorPropDef[`color`][`values`][number]

interface TypeKindTyokens {
  symbol: string
  color: RadixColor
}

export const typeKindTokensIndex = {
  // O
  Object: { symbol: `O`, color: `iris` },
  Interface: { symbol: `T`, color: `pink` },
  Union: { symbol: `U`, color: `pink` },
  // IO
  Enum: { symbol: `E`, color: `orange` },
  Scalar: { symbol: `S`, color: `orange` },
  // I
  InputObject: { symbol: `I`, color: `green` },
  //
  // rare (todo: never possible? limit to NAMED type kinds?)
  List: { symbol: `L`, color: `gray` },
  NonNull: { symbol: `N`, color: `gray` },
} satisfies Record<Grafaid.Schema.TypeKindName, TypeKindTyokens>

export const unknownTypeKindToken: TypeKindTyokens = {
  symbol: `UNKNOWN`,
  color: `jade`,
}
