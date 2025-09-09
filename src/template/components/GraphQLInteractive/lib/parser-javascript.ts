/**
 * Tree-sitter JavaScript/TypeScript parsing for Graffle syntax highlighting
 *
 * This module provides JavaScript/TypeScript parsing using tree-sitter
 * to enable syntax highlighting for Graffle's document builder code.
 */

import javascriptWasmUrl from '@vscode/tree-sitter-wasm/wasm/tree-sitter-javascript.wasm?url'
import type { CodeAnnotation } from 'codehike/code'
import * as WebTreeSitter from 'web-tree-sitter'
import treeSitterWasmUrl from 'web-tree-sitter/tree-sitter.wasm?url'

/**
 * JavaScript token structure for syntax highlighting
 */
export interface JavaScriptToken {
  /** Text content of the token */
  text: string

  /** Start position in the source */
  start: number

  /** End position in the source */
  end: number

  /** CSS class for syntax highlighting */
  cssClass: string
}

/**
 * Map tree-sitter JavaScript node types to generic CSS classes
 */
function getJavaScriptTokenClass(nodeType: string): string {
  switch (nodeType) {
    // Keywords
    case 'const':
    case 'let':
    case 'var':
    case 'function':
    case 'async':
    case 'await':
    case 'return':
    case 'if':
    case 'else':
    case 'for':
    case 'while':
    case 'do':
    case 'switch':
    case 'case':
    case 'break':
    case 'continue':
    case 'import':
    case 'export':
    case 'from':
    case 'default':
    case 'try':
    case 'catch':
    case 'finally':
    case 'throw':
    case 'new':
    case 'typeof':
    case 'instanceof':
    case 'in':
    case 'of':
    case 'void':
    case 'delete':
      return 'keyword'

    // Strings
    case 'string':
    case 'template_string':
    case 'string_fragment':
      return 'string'

    // Numbers
    case 'number':
      return 'number'

    // Booleans and null/undefined
    case 'true':
    case 'false':
    case 'null':
    case 'undefined':
      return 'boolean'

    // Comments
    case 'comment':
      return 'comment'

    // Identifiers
    case 'identifier':
      return 'identifier'

    // Properties (object keys)
    case 'property_identifier':
    case 'shorthand_property_identifier':
      return 'property'

    // Function/method calls
    case 'call_expression':
      return 'function'

    // Operators
    case '=>':
    case '=':
    case '==':
    case '===':
    case '!=':
    case '!==':
    case '<':
    case '>':
    case '<=':
    case '>=':
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
    case '++':
    case '--':
    case '&&':
    case '||':
    case '!':
    case '?':
    case ':':
    case '...':
    case '.':
      return 'operator'

    // Punctuation
    case '{':
    case '}':
    case '[':
    case ']':
    case '(':
    case ')':
    case ',':
    case ';':
      return 'punctuation'

    default:
      return 'text'
  }
}

// Parser instance - initialized once and reused
let parser: WebTreeSitter.Parser | null = null
let JavaScriptLanguage: WebTreeSitter.Language | null = null

/**
 * Initialize the JavaScript parser
 */
async function initializeParser(): Promise<void> {
  if (parser && JavaScriptLanguage) return

  // Skip initialization in test environment
  if (typeof process !== 'undefined' && process.env['NODE_ENV'] === 'test') {
    return
  }

  // Initialize tree-sitter WASM
  await WebTreeSitter.Parser.init({
    locateFile(scriptName: string, scriptDirectory: string) {
      return treeSitterWasmUrl
    },
  })

  // Create parser
  parser = new WebTreeSitter.Parser()

  // Load JavaScript language
  JavaScriptLanguage = await WebTreeSitter.Language.load(javascriptWasmUrl)
  parser.setLanguage(JavaScriptLanguage)
}

/**
 * Simple regex-based tokenizer for test environment
 */
function simpleTokenize(code: string): JavaScriptToken[] {
  const tokens: JavaScriptToken[] = []

  // Simple regex patterns for basic tokenization
  const patterns: Array<[RegExp, string]> = [
    [
      /\b(const|let|var|function|async|await|return|if|else|for|while|do|switch|case|break|continue|import|export|from|default|try|catch|finally|throw|new|typeof|instanceof|in|of|void|delete)\b/g,
      'keyword',
    ],
    [/\b(true|false|null|undefined)\b/g, 'boolean'],
    [/\b\d+(\.\d+)?\b/g, 'number'],
    [/"[^"]*"|'[^']*'|`[^`]*`/g, 'string'],
    [/\/\/[^\n]*/g, 'comment'],
    [/\/\*[\s\S]*?\*\//g, 'comment'],
    [/[{}[\](),;]/g, 'punctuation'],
    [/[+\-*/%=<>!&|?:\.]+/g, 'operator'],
  ]

  // Mark all positions as unprocessed
  const processed = new Array(code.length).fill(false)

  for (const [pattern, cssClass] of patterns) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(code)) !== null) {
      // Skip if already processed
      if (processed[match.index]) continue

      tokens.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        cssClass,
      })

      // Mark as processed
      for (let i = match.index; i < match.index + match[0].length; i++) {
        processed[i] = true
      }
    }
  }

  // Handle identifiers and properties (including $-prefixed)
  const identifierPattern = /\$?[a-zA-Z_][a-zA-Z0-9_$]*\b/g
  let match
  while ((match = identifierPattern.exec(code)) !== null) {
    if (processed[match.index]) continue

    // Check if it's a property (in object literal context)
    const beforeMatch = code.substring(Math.max(0, match.index - 10), match.index)
    const afterMatch = code.substring(
      match.index + match[0].length,
      Math.min(code.length, match.index + match[0].length + 2),
    )

    let cssClass = 'identifier'

    // Check if this is a property in an object literal
    // Look for patterns like "{ prop:" or ", prop:" or "prop:"
    if (afterMatch.trimStart().startsWith(':')) {
      // Make sure we're not in a ternary operator (? :)
      if (!beforeMatch.trimEnd().endsWith('?')) {
        cssClass = 'property'
      }
    } else if (beforeMatch.endsWith('.')) {
      cssClass = 'property'
    }

    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      cssClass,
    })

    for (let i = match.index; i < match.index + match[0].length; i++) {
      processed[i] = true
    }
  }

  // Sort by position
  tokens.sort((a, b) => a.start - b.start)

  // Fill gaps with text tokens
  const finalTokens: JavaScriptToken[] = []
  let lastEnd = 0

  for (const token of tokens) {
    if (token.start > lastEnd) {
      const gap = code.substring(lastEnd, token.start)
      if (gap) {
        finalTokens.push({
          text: gap,
          start: lastEnd,
          end: token.start,
          cssClass: 'text',
        })
      }
    }
    finalTokens.push(token)
    lastEnd = token.end
  }

  // Add trailing text
  if (lastEnd < code.length) {
    finalTokens.push({
      text: code.substring(lastEnd),
      start: lastEnd,
      end: code.length,
      cssClass: 'text',
    })
  }

  return finalTokens
}

/**
 * Parse JavaScript/TypeScript code into tokens for syntax highlighting
 */
export async function parseJavaScriptWithTreeSitter(
  code: string,
  annotations: CodeAnnotation[] = [],
): Promise<JavaScriptToken[]> {
  // Initialize parser if needed
  await initializeParser()

  // Use simple tokenizer in test environment or if parser isn't available
  if (!parser || !JavaScriptLanguage) {
    return simpleTokenize(code)
  }

  // Parse the code
  const tree = parser.parse(code)
  if (!tree) {
    // Fall back to simple tokenizer if parsing fails
    return simpleTokenize(code)
  }

  const tokens: JavaScriptToken[] = []

  // Walk the tree and create tokens
  const cursor = tree.walk()

  function visitNode(): void {
    const node = cursor.currentNode

    // Skip the root node and some structural nodes
    if (node.type !== 'program' && node.type !== 'statement_block' && node.type !== 'expression_statement') {
      // Get the text for this node
      const text = code.substring(node.startIndex, node.endIndex)

      // Skip empty nodes
      if (text.trim()) {
        tokens.push({
          text,
          start: node.startIndex,
          end: node.endIndex,
          cssClass: getJavaScriptTokenClass(node.type),
        })
      }
    }

    // Visit children
    if (cursor.gotoFirstChild()) {
      do {
        visitNode()
      } while (cursor.gotoNextSibling())
      cursor.gotoParent()
    }
  }

  visitNode()

  // Clean up
  tree.delete()

  // Sort tokens by position
  tokens.sort((a, b) => a.start - b.start)

  // Fill in gaps with whitespace tokens
  const finalTokens: JavaScriptToken[] = []
  let lastEnd = 0

  for (const token of tokens) {
    // Add whitespace between tokens if needed
    if (token.start > lastEnd) {
      const whitespace = code.substring(lastEnd, token.start)
      if (whitespace) {
        finalTokens.push({
          text: whitespace,
          start: lastEnd,
          end: token.start,
          cssClass: 'text',
        })
      }
    }

    finalTokens.push(token)
    lastEnd = token.end
  }

  // Add trailing whitespace if any
  if (lastEnd < code.length) {
    finalTokens.push({
      text: code.substring(lastEnd),
      start: lastEnd,
      end: code.length,
      cssClass: 'text',
    })
  }

  return finalTokens
}
