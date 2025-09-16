import { EffectKit } from '#lib/kit-temp/effect'
import {
  ColonToken,
  DollarToken,
  DotToken,
  EOFToken,
  EqualsToken,
  HashToken,
  LBracketToken,
  NameToken,
  RBracketToken,
  Token,
  VersionToken,
} from './tokens.js'

/**
 * Tokenize a GraphQL schema path string into tokens
 *
 * @param input The path string to tokenize
 * @returns Array of tokens
 * @throws {TokenizerError} If invalid characters are encountered
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let pos = 0

  while (pos < input.length) {
    const char = input[pos]!

    // Skip whitespace
    if (/\s/.test(char)) {
      pos++
      continue
    }

    // Version (starts with v and followed by numbers/dots)
    if (char === 'v' && pos + 1 < input.length && /\d/.test(input[pos + 1]!)) {
      const start = pos
      pos++ // Skip 'v'
      while (pos < input.length && /[\d.,\-]/.test(input[pos]!)) {
        pos++
      }
      tokens.push(VersionToken.make({
        value: input.slice(start, pos),
        pos: start,
      }))
      continue
    }

    // Name (alphanumeric and underscore)
    if (/[a-zA-Z_]/.test(char)) {
      const start = pos
      while (pos < input.length && /[a-zA-Z0-9_]/.test(input[pos]!)) {
        pos++
      }
      tokens.push(NameToken.make({
        value: input.slice(start, pos),
        pos: start,
      }))
      continue
    }

    // Single character tokens
    switch (char) {
      case EffectKit.Schema.Literal.getValueAtField(DotToken, 'display'):
        tokens.push(DotToken.make({ pos }))
        pos++
        continue
      case EffectKit.Schema.Literal.getValueAtField(DollarToken, 'display'):
        tokens.push(DollarToken.make({ pos }))
        pos++
        continue
      case EffectKit.Schema.Literal.getValueAtField(LBracketToken, 'display'):
        tokens.push(LBracketToken.make({ pos }))
        pos++
        continue
      case EffectKit.Schema.Literal.getValueAtField(RBracketToken, 'display'):
        tokens.push(RBracketToken.make({ pos }))
        pos++
        continue
      case EffectKit.Schema.Literal.getValueAtField(HashToken, 'display'):
        tokens.push(HashToken.make({ pos }))
        pos++
        continue
      case EffectKit.Schema.Literal.getValueAtField(EqualsToken, 'display'):
        tokens.push(EqualsToken.make({ pos }))
        pos++
        continue
      case EffectKit.Schema.Literal.getValueAtField(ColonToken, 'display'):
        tokens.push(ColonToken.make({ pos }))
        pos++
        continue
    }

    // Unknown character
    throw new TokenizerError(`Unexpected character '${char}' at position ${pos}`, pos)
  }

  // Add EOF token
  tokens.push(EOFToken.make({ pos }))

  return tokens
}

/**
 * Tokenizer error thrown when invalid characters are encountered
 */
export class TokenizerError extends Error {
  constructor(
    message: string,
    public readonly position: number,
  ) {
    super(message)
    this.name = 'TokenizerError'
  }
}
