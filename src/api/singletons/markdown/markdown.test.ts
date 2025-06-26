import { describe, expect, test } from 'vitest'
import { parse } from './markdown.ts'

describe('markdown parser with syntax highlighting', () => {
  test('parse highlights code blocks', { timeout: 10000 }, async () => {
    const markdown = `
# Hello

\`\`\`javascript
const x = 42
console.log(x)
\`\`\`
`
    const result = await parse(markdown)

    expect(result).toContain('<h1>Hello</h1>')
    expect(result).toContain('<pre')
    expect(result).toContain('shiki')
    expect(result).toContain('console')
    expect(result).toContain('42')
  })

  // Note: parseSync cannot be used with async rehype plugins like Shiki
  // This is a known limitation - syntax highlighting requires async processing

  test('parse supports GraphQL syntax', async () => {
    const markdown = `
\`\`\`graphql
type Query {
  user(id: ID!): User
}
\`\`\`
`
    const result = await parse(markdown)

    expect(result).toContain('type')
    expect(result).toContain('Query')
    // Check that both ID and ! are present (they may be in separate spans)
    expect(result).toContain('> ID<')
    expect(result).toContain('>!</')
  })

  test('parse handles inline code', async () => {
    const markdown = 'This is `inline code` in a sentence.'
    const result = await parse(markdown)

    expect(result).toContain('<code>inline code</code>')
  })

  test('parse supports GitHub Flavored Markdown', async () => {
    const markdown = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

- [x] Task 1
- [ ] Task 2
`
    const result = await parse(markdown)

    expect(result).toContain('<table>')
    expect(result).toContain('<input')
    expect(result).toContain('checked')
  })

  test('parse handles code blocks without language', async () => {
    const markdown = `
\`\`\`
plain text without language
\`\`\`
`
    const result = await parse(markdown)

    expect(result).toContain('<pre')
    expect(result).toContain('plain text without language')
  })

  test('parse preserves theme CSS variables', async () => {
    const markdown = `
\`\`\`javascript
const theme = "light"
\`\`\`
`
    const result = await parse(markdown)

    expect(result).toContain('--shiki-light')
    expect(result).toContain('--shiki-dark')
  })
})
