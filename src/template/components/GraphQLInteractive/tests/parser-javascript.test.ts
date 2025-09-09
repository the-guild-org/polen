import { describe, expect, test } from 'vitest'
import { parseJavaScriptWithTreeSitter } from '../lib/parser-javascript.js'

describe('parseJavaScriptWithTreeSitter', () => {
  test('tokenizes JavaScript keywords correctly', async () => {
    const code = 'const result = await client.query({})'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    // Find keyword tokens
    const constToken = tokens.find(t => t.text === 'const')
    const awaitToken = tokens.find(t => t.text === 'await')

    expect(constToken?.cssClass).toBe('keyword')
    expect(awaitToken?.cssClass).toBe('keyword')
  })

  test('tokenizes strings correctly', async () => {
    const code = 'const name = "pikachu"'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    // Find string token (including quotes)
    const stringToken = tokens.find(t => t.text === '"pikachu"')
    expect(stringToken?.cssClass).toBe('string')
  })

  test('tokenizes numbers correctly', async () => {
    const code = 'const limit = 10'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    const numberToken = tokens.find(t => t.text === '10')
    expect(numberToken?.cssClass).toBe('number')
  })

  test('tokenizes boolean values correctly', async () => {
    const code = 'const isEnabled = true'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    const booleanToken = tokens.find(t => t.text === 'true')
    expect(booleanToken?.cssClass).toBe('boolean')
  })

  test('tokenizes object properties correctly', async () => {
    const code = '{ pokemon: { id: true } }'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    // Properties in object literals get 'property' class
    const pokemonToken = tokens.find(t => t.text === 'pokemon' && t.cssClass === 'property')
    const idToken = tokens.find(t => t.text === 'id' && t.cssClass === 'property')

    expect(pokemonToken).toBeDefined()
    expect(idToken).toBeDefined()
  })

  test('tokenizes operators correctly', async () => {
    const code = 'const sum = a + b'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    const plusToken = tokens.find(t => t.text === '+')
    const equalsToken = tokens.find(t => t.text === '=')

    expect(plusToken?.cssClass).toBe('operator')
    expect(equalsToken?.cssClass).toBe('operator')
  })

  test('tokenizes arrow functions correctly', async () => {
    const code = 'const fn = () => {}'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    const arrowToken = tokens.find(t => t.text === '=>')
    expect(arrowToken?.cssClass).toBe('operator')
  })

  test('tokenizes punctuation correctly', async () => {
    const code = '{ a: 1, b: 2 }'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    const openBrace = tokens.find(t => t.text === '{')
    const closeBrace = tokens.find(t => t.text === '}')
    const comma = tokens.find(t => t.text === ',')

    expect(openBrace?.cssClass).toBe('punctuation')
    expect(closeBrace?.cssClass).toBe('punctuation')
    expect(comma?.cssClass).toBe('punctuation')
  })

  test('tokenizes comments correctly', async () => {
    const code = '// This is a comment\nconst x = 1'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    const commentToken = tokens.find(t => t.text.includes('This is a comment'))
    expect(commentToken?.cssClass).toBe('comment')
  })

  test('preserves whitespace between tokens', async () => {
    const code = 'const   x   =   1'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    // Reconstruct the original code from tokens
    const reconstructed = tokens.map(t => t.text).join('')
    expect(reconstructed).toBe(code)
  })

  test('handles complex nested structures', async () => {
    const code = `{
      pokemon: {
        $include: {
          if: isDetailed,
        },
        id: true,
        name: true,
        types: {
          type: {
            name: true
          }
        }
      }
    }`

    const tokens = await parseJavaScriptWithTreeSitter(code)

    // Should have tokens for all parts
    expect(tokens.length).toBeGreaterThan(0)

    // Check that $include is tokenized (likely as a property)
    const includeToken = tokens.find(t => t.text === '$include')
    expect(includeToken?.cssClass).toBe('property')

    // Check nested properties
    const typesToken = tokens.find(t => t.text === 'types' && t.cssClass === 'property')
    expect(typesToken).toBeDefined()
  })

  test('returns tokens sorted by position', async () => {
    const code = 'const x = 1; const y = 2;'
    const tokens = await parseJavaScriptWithTreeSitter(code)

    // Check that tokens are in order
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i].start).toBeGreaterThanOrEqual(tokens[i - 1].end)
    }
  })

  test('handles empty code', async () => {
    const code = ''
    const tokens = await parseJavaScriptWithTreeSitter(code)

    expect(tokens).toEqual([])
  })

  test('handles code with only whitespace', async () => {
    const code = '   \n  \t  '
    const tokens = await parseJavaScriptWithTreeSitter(code)

    // Should have one token for the whitespace
    expect(tokens.length).toBe(1)
    expect(tokens[0].text).toBe(code)
    expect(tokens[0].cssClass).toBe('text')
  })
})
