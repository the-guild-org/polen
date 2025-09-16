import { S } from '#lib/kit-temp'

// ============================================================================
// Token Helpers
// ============================================================================

const TokenFor = <const $Tag extends string, $Display extends string>(tag: $Tag, display: $Display) =>
  S.TaggedStruct(tag, {
    display: S.Literal(display)
      .pipe(
        S.propertySignature,
        S.withConstructorDefault(() => display),
      ),
    value: S.String,
    pos: S.Number,
  })

const TokenSymbolFor = <const $Tag extends string, $Display extends string>(tag: $Tag, display: $Display) =>
  S.TaggedStruct(tag, {
    display: S.Literal(display)
      .pipe(
        S.propertySignature,
        S.withConstructorDefault(() => display),
      ),
    pos: S.Number,
  })

// ============================================================================
// Token Types
// ============================================================================

/**
 * Token types for the GraphQL schema path tokenizer
 */
export const TokenType = S.Enums(
  {
    NAME: 'NAME',
    VERSION: 'VERSION',
    DOT: 'DOT',
    DOLLAR: 'DOLLAR',
    HASH: 'HASH',
    COLON: 'COLON',
    EOF: 'EOF',
  } as const,
)

export type TokenType = S.Schema.Type<typeof TokenType>

// ============================================================================
// Token Schemas
// ============================================================================

export const NameToken = TokenFor(TokenType.enums.NAME, 'name')
export const VersionToken = TokenFor(TokenType.enums.VERSION, 'version')
export const DotToken = TokenSymbolFor(TokenType.enums.DOT, '.')
export const DollarToken = TokenSymbolFor(TokenType.enums.DOLLAR, '$')
export const HashToken = TokenSymbolFor(TokenType.enums.HASH, '#')
export const ColonToken = TokenSymbolFor(TokenType.enums.COLON, ':')
export const EOFToken = TokenSymbolFor(TokenType.enums.EOF, 'EOF')

// ============================================================================
// Union Token
// ============================================================================

export const Token = S.Union(
  NameToken,
  VersionToken,
  DotToken,
  DollarToken,
  HashToken,
  ColonToken,
  EOFToken,
)

// ============================================================================
// Types
// ============================================================================

export type Token = S.Schema.Type<typeof Token>
export type NameToken = S.Schema.Type<typeof NameToken>
export type VersionToken = S.Schema.Type<typeof VersionToken>
export type DotToken = S.Schema.Type<typeof DotToken>
export type DollarToken = S.Schema.Type<typeof DollarToken>
export type HashToken = S.Schema.Type<typeof HashToken>
export type ColonToken = S.Schema.Type<typeof ColonToken>
export type EOFToken = S.Schema.Type<typeof EOFToken>

// ============================================================================
// Constructors
// ============================================================================

export const makeNameToken = NameToken.make
export const makeVersionToken = VersionToken.make
export const makeDotToken = DotToken.make
export const makeDollarToken = DollarToken.make
export const makeHashToken = HashToken.make
export const makeColonToken = ColonToken.make
export const makeEOFToken = EOFToken.make

// ============================================================================
// Type Guards
// ============================================================================

export const isNameToken = S.is(NameToken)
export const isVersionToken = S.is(VersionToken)
export const isDotToken = S.is(DotToken)
export const isDollarToken = S.is(DollarToken)
export const isHashToken = S.is(HashToken)
export const isColonToken = S.is(ColonToken)
export const isEOFToken = S.is(EOFToken)
