import { S } from '#lib/kit-temp/effect'

// ============================================================================
// Schema and Type
// ============================================================================

const NodeFields = {
  key: S.String,
  value: S.optional(S.Unknown),
}

export const Node = S.Struct({
  ...NodeFields,
  children: S.optional(
    S.Array(
      S.suspend((): S.Schema<Node, NodeEncoded> => Node),
    ),
  ),
})

interface NodeEncoded extends S.Schema.Encoded<S.Struct<typeof NodeFields>> {
  readonly children?: ReadonlyArray<NodeEncoded> | undefined
}

interface Node extends S.Struct.Type<typeof NodeFields> {
  readonly children?: ReadonlyArray<Node> | undefined
}

// export type Node = S.Schema.Type<typeof Node>

// ============================================================================
// Constructors
// ============================================================================

export const make = S.decodeSync(Node)

// ============================================================================
// Type Guard
// ============================================================================

export const is = S.is(Node)

// ============================================================================
// Codec
// ============================================================================

export const decode = S.decode(Node)
export const decodeSync = S.decodeSync(Node)
export const encode = S.encode(Node)

// ============================================================================
// Equivalence
// ============================================================================

export const equivalence = S.equivalence(Node)
