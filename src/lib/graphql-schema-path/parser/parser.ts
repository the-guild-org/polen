import { Nodes } from '../nodes/$.js'
import type { Path } from '../path.js'
import { type Token } from './tokens.js'
import * as Tokens from './tokens.js'

// ============================================================================
// Helpers
// ============================================================================

const tokenToString = (token: Token): string => token.display

interface State {
  tokens: Token[]
  pos: number
}

// ============================================================================
// Parser
// ============================================================================

/**
 * Parse tokens into a GraphQL schema path AST
 */
export function parse(tokens: Token[]): Path {
  let state: State = { tokens, pos: 0 }

  const versionResult = parseVersion(state)
  const version = versionResult.value
  state = versionResult.state

  const pathResult = parseTypePath(state)
  const path = pathResult.value
  state = pathResult.state

  const endToken = peek(state)
  if (!Tokens.isEOFToken(endToken)) {
    throw new ParseError(
      `Unexpected token '${tokenToString(endToken)}' at position ${endToken.pos}`,
      endToken.pos,
    )
  }

  return Nodes.Root.make({
    version,
    next: path,
  })
}

// ============================================================================
// Version Parsing
// ============================================================================

function parseVersion(state: State): { value: string | undefined; state: State } {
  const token = peek(state)
  if (Tokens.isVersionToken(token)) {
    state = advance(state)

    // Version must be followed by a colon
    const colonToken = peek(state)
    if (Tokens.isColonToken(colonToken)) {
      state = advance(state)
      return {
        value: token.value,
        state,
      }
    } else {
      throw new ParseError(
        `Expected ':' after version but got '${tokenToString(colonToken)}' at position ${colonToken.pos}`,
        colonToken.pos,
      )
    }
  }
  return { value: undefined, state }
}

// ============================================================================
// Path Parsing
// ============================================================================

function parseTypePath(state: State): { value: any; state: State } {
  const typeResult = parseType(state)
  const type = typeResult.value
  state = typeResult.state

  const nextResult = parseTypeContinuation(state)
  const next = nextResult.value
  state = nextResult.state

  return {
    value: Nodes.Type.make({
      name: type,
      next,
    }),
    state,
  }
}

function parseTypeContinuation(state: State): { value: any; state: State } {
  const token = peek(state)

  if (Tokens.isDotToken(token)) return parseField(state)

  return { value: undefined, state }
}

function parseField(state: State): { value: any; state: State } {
  // Skip dot
  state = advance(state)

  const nameResult = parseName(state)
  const name = nameResult.value
  state = nameResult.state

  const nextResult = parseFieldContinuation(state)
  const next = nextResult.value
  state = nextResult.state

  return {
    value: Nodes.Field.make({
      name,
      next,
    }),
    state,
  }
}

function parseFieldContinuation(state: State): { value: any; state: State } {
  const token = peek(state)

  if (Tokens.isDotToken(token)) return parseField(state)
  if (Tokens.isDollarToken(token)) return parseArgument(state)
  if (Tokens.isHashToken(token)) return parseResolvedType(state)

  return { value: undefined, state }
}

function parseArgument(state: State): { value: any; state: State } {
  // Skip $
  state = advance(state)

  const nameResult = parseName(state)
  const name = nameResult.value
  state = nameResult.state

  const nextResult = parseArgumentContinuation(state)
  const next = nextResult.value
  state = nextResult.state

  return {
    value: Nodes.Argument.make({
      name,
      next,
    }),
    state,
  }
}

function parseArgumentContinuation(state: State): { value: any; state: State } {
  const token = peek(state)

  if (Tokens.isDotToken(token)) return parseField(state)
  if (Tokens.isHashToken(token)) return parseResolvedType(state)

  return { value: undefined, state }
}

function parseResolvedType(state: State): { value: any; state: State } {
  // Skip #
  state = advance(state)
  return {
    value: Nodes.ResolvedType.make({}),
    state,
  }
}

// ============================================================================
// Utilities
// ============================================================================

function peek(state: State): Token {
  return state.tokens[state.pos] || Tokens.makeEOFToken({ pos: state.pos })
}

function advance(state: State): State {
  return { ...state, pos: state.pos + 1 }
}

function parseName(state: State): { value: string; state: State } {
  const token = peek(state)
  if (!Tokens.isNameToken(token)) {
    throw new ParseError(
      `Expected name but got '${tokenToString(token)}' at position ${token.pos}`,
      token.pos,
    )
  }
  return {
    value: token.value,
    state: advance(state),
  }
}

function parseType(state: State): { value: string; state: State } {
  return parseName(state)
}

// ============================================================================
// Errors
// ============================================================================

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly position: number,
  ) {
    super(message)
    this.name = 'ParseError'
  }
}
