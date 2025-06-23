import { describe, expect, it } from 'vitest'
import { rehypeGraphQLSimple } from './rehype-plugin-simple.ts'

describe('rehypeGraphQLSimple', () => {
  it('should create a plugin function', () => {
    const plugin = rehypeGraphQLSimple() as any
    expect(typeof plugin).toBe('function')
  })

  it('should accept options', () => {
    const plugin = rehypeGraphQLSimple({
      disabled: true,
      componentName: 'CustomComponent',
      importSource: '@custom/path',
    }) as any
    expect(typeof plugin).toBe('function')
  })

  it('should transform GraphQL code blocks', () => {
    const plugin = rehypeGraphQLSimple() as any

    // Mock HAST tree
    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {
                className: ['language-graphql'],
              },
              children: [
                {
                  type: 'text',
                  value: 'query { user { name } }',
                },
              ],
            },
          ],
        },
      ],
    }

    // Transform the tree (rehype plugins are called with transformer function)
    const transformer = plugin as any
    transformer(tree)

    // Check that import was added
    expect(tree.children[0]).toMatchObject({
      type: 'mdxjsEsm',
      value: expect.stringContaining('import { GraphQLDocument }'),
    })

    // Check that pre was replaced with component
    expect(tree.children[1]).toMatchObject({
      type: 'element',
      tagName: 'GraphQLDocument',
    })
  })

  it('should handle options in language string', () => {
    const plugin = rehypeGraphQLSimple() as any

    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {
                className: ['language-graphql plain debug'],
              },
              children: [
                {
                  type: 'text',
                  value: 'query { user }',
                },
              ],
            },
          ],
        },
      ],
    }

    const transformer = plugin as any
    transformer(tree)

    // Check that options were parsed
    const component = tree.children[1] as any
    expect(component.properties.options).toEqual({
      plain: true,
      debug: true,
    })
  })

  it('should not transform when disabled', () => {
    const plugin = rehypeGraphQLSimple({ disabled: true }) as any

    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {
                className: ['language-graphql'],
              },
              children: [
                {
                  type: 'text',
                  value: 'query { user }',
                },
              ],
            },
          ],
        },
      ],
    }

    const originalTree = JSON.parse(JSON.stringify(tree))
    const transformer = plugin as any
    transformer(tree)

    // Tree should remain unchanged
    expect(tree).toEqual(originalTree)
  })

  it('should ignore non-GraphQL code blocks', () => {
    const plugin = rehypeGraphQLSimple() as any

    const tree = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'pre',
          children: [
            {
              type: 'element',
              tagName: 'code',
              properties: {
                className: ['language-javascript'],
              },
              children: [
                {
                  type: 'text',
                  value: 'const x = 1',
                },
              ],
            },
          ],
        },
      ],
    }

    const transformer = plugin as any
    transformer(tree)

    // Should not add import or transform
    expect(tree.children.length).toBe(1)
    expect(tree.children[0]).toMatchObject({
      type: 'element',
      tagName: 'pre',
    })
  })
})
