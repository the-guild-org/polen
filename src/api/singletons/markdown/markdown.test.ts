import { describe, expect, test } from 'vitest'
import { parse } from './markdown.js'

describe('markdown parser', () => {
  test('parse converts code blocks', async () => {
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
    expect(result).toContain('<code class="language-javascript">')
    expect(result).toContain('console')
    expect(result).toContain('42')
  })

  test('parse supports GraphQL syntax', async () => {
    const markdown = `
\`\`\`graphql
type Query {
  user(id: ID!): User
}
\`\`\`
`
    const result = await parse(markdown)

    expect(result).toContain('<code class="language-graphql">')
    expect(result).toContain('type Query')
    expect(result).toContain('ID!')
    expect(result).toContain('User')
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

  test('parse converts code blocks without syntax highlighting', async () => {
    const markdown = `
\`\`\`javascript
const theme = "light"
\`\`\`
`
    const result = await parse(markdown)

    expect(result).toContain('<pre>')
    expect(result).toContain('<code class="language-javascript">')
    expect(result).toContain('const theme = "light"')
  })
})
