/**
 * Simple Rehype plugin for transforming GraphQL code blocks
 *
 * This is a simplified version that works with Polen's existing setup
 * without requiring additional dependencies.
 */

// Simple plugin type to avoid unified complexity
type RehypePlugin = (options?: any) => (tree: any, file?: any) => void

// Basic HAST types for our use case
interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, any>
  children?: HastNode[]
  value?: string
}

interface Root {
  type: 'root'
  children: HastNode[]
}

/**
 * Options for the rehype GraphQL plugin
 */
export interface RehypeGraphQLOptions {
  /**
   * Whether to disable the plugin
   */
  disabled?: boolean

  /**
   * Component name to use for GraphQL blocks
   * @default 'GraphQLDocument'
   */
  componentName?: string

  /**
   * Import source for the GraphQL component
   * @default '#lib/graphql-document/components/GraphQLDocument'
   */
  importSource?: string
}

/**
 * Simple traversal function for HAST nodes
 */
function traverse(node: any, visitor: (node: any, parent: any, index: number) => void, parent?: any, index = 0) {
  visitor(node, parent, index)

  if (node.children && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      traverse(node.children[i], visitor, node, i)
    }
  }
}

/**
 * Extract text content from a node
 */
function extractText(node: any): string {
  if (node.type === 'text') {
    return node.value || ''
  }

  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }

  return ''
}

/**
 * Parse language and options from className
 */
function parseLanguage(className: string[]): { language: string; options: Record<string, any> } | null {
  const langClass = className.find(cls => cls.startsWith('language-'))
  if (!langClass) return null

  const parts = langClass.replace('language-', '').split(/\s+/)
  const language = parts[0] || ''
  const options: Record<string, any> = {}

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]!
    if (part.includes('=')) {
      const [key, value] = part.split('=')
      options[key!] = value === 'true' ? true : value === 'false' ? false : value
    } else {
      options[part] = true
    }
  }

  return { language, options }
}

/**
 * Simple rehype plugin to transform GraphQL code blocks
 */
export const rehypeGraphQLSimple: RehypePlugin = function(options = {}) {
  const {
    disabled = false,
    componentName = 'GraphQLDocument',
    importSource = '#lib/graphql-document/components/GraphQLDocument',
  } = options

  return (tree) => {
    if (disabled) return

    let hasGraphQLBlocks = false
    const nodesToReplace: Array<{ parent: any; index: number; newNode: any }> = []

    // Find GraphQL code blocks
    traverse(tree, (node, parent, index) => {
      if (
        node.type === 'element'
        && node.tagName === 'pre'
        && node.children?.[0]?.type === 'element'
        && node.children[0].tagName === 'code'
      ) {
        const codeNode = node.children[0]
        const className = codeNode.properties?.className

        if (Array.isArray(className)) {
          const parsed = parseLanguage(className)

          if (parsed && parsed.language === 'graphql') {
            hasGraphQLBlocks = true
            const source = extractText(codeNode)

            // Create component node
            const componentNode = {
              type: 'element',
              tagName: componentName,
              properties: {
                options: parsed.options,
                highlightedHtml: serializeNode(node),
              },
              children: [{
                type: 'text',
                value: source,
              }],
            }

            nodesToReplace.push({ parent, index, newNode: componentNode })
          }
        }
      }
    })

    // Replace nodes
    for (const { parent, index, newNode } of nodesToReplace) {
      if (parent && parent.children) {
        parent.children[index] = newNode
      }
    }

    // Add import if needed
    if (hasGraphQLBlocks) {
      const importNode = {
        type: 'mdxjsEsm',
        value: `import { ${componentName} } from '${importSource}'`,
      }

      tree.children.unshift(importNode as any)
    }
  }
}

/**
 * Simple HTML serialization
 */
function serializeNode(node: any): string {
  if (node.type === 'text') {
    return node.value || ''
  }

  if (node.type === 'element') {
    const tag = node.tagName
    const props = node.properties || {}
    const attrs = Object.entries(props)
      .map(([key, value]) => {
        if (key === 'className' && Array.isArray(value)) {
          return `class="${value.join(' ')}"`
        }
        return `${key}="${value}"`
      })
      .join(' ')

    const children = node.children?.map(serializeNode).join('') || ''

    return attrs ? `<${tag} ${attrs}>${children}</${tag}>` : `<${tag}>${children}</${tag}>`
  }

  return ''
}

/**
 * Create a configured plugin instance
 */
export function createRehypeGraphQLSimple(options?: RehypeGraphQLOptions): any {
  return rehypeGraphQLSimple(options) as any
}
