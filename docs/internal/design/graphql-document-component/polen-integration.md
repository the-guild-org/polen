# GraphQL Document Component - Polen Integration

## Integration Strategy

The GraphQL Document Component integrates deeply with Polen's existing infrastructure to provide a seamless experience while maintaining performance and consistency.

## Build Pipeline Integration

### Markdown Pipeline Integration

Custom rehype plugin intercepts ````graphql` blocks and transforms them:

````js
// In MDX configuration
rehypePlugins: ;
;[
  rehypeGraphqlBlocks, // Transform ```graphql -> <GraphQLDocument>
  rehypeShiki, // Apply syntax highlighting
]
````

### Rehype Plugin Implementation

````tsx
// Hook into Polen's build pipeline and configuration
interface PolenIntegration {
  // Rehype plugin for automatic ```graphql transformation
  rehypePlugin: RehypePlugin

  // Build-time validation
  validateDocuments(
    documents: Array<{ source: string; filePath: string }>,
  ): ValidationReport

  // Schema context provider
  SchemaProvider: React.FC<{ children: React.ReactNode }>
}

// Rehype plugin that transforms ```graphql blocks
const rehypeGraphQLBlocks: RehypePlugin = () => {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'pre' && node.children[0]?.tagName === 'code') {
        const codeNode = node.children[0]
        const language = getLanguageFromClassName(
          codeNode.properties?.className,
        )

        if (language === 'graphql') {
          const source = extractTextContent(codeNode)
          const config = parseInlineConfig(language) // e.g., "graphql plain=true"

          // Transform to React component
          node.type = 'mdxJsxFlowElement'
          node.name = 'GraphQLDocument'
          node.attributes = [
            { type: 'mdxJsxAttribute', name: 'options', value: config },
          ]
          node.children = [{ type: 'text', value: source }]
        }
      }
    })
  }
}
````

## Schema Integration

### Leveraging Polen's Schema System

```tsx
// Integrates with Polen's existing schema loading
class PolenSchemaResolver implements SchemaResolver {
  constructor(
    private schema: GraphQLSchema,
    private routeGenerator: RouteGenerator,
  ) {}

  resolveIdentifier(identifier: Identifier): SchemaResolution | null {
    // Use Polen's existing schema introspection
    const type = this.schema.getType(identifier.parentType)
    const field = type?.getFields?.()?.[identifier.name]

    return {
      exists: !!field,
      documentation: this.extractDocs(field),
      referenceUrl: this.routeGenerator.generateSchemaPath(
        identifier.schemaPath,
      ),
      deprecated: field?.deprecationReason
        ? { reason: field.deprecationReason }
        : undefined,
    }
  }

  private extractDocs(field: any): Documentation | null {
    // Extract from GraphQL schema descriptions, Polen's augmentations, etc.
    return {
      description: field?.description,
      typeInfo: this.formatTypeInfo(field?.type),
      examples: this.getExamples(field),
    }
  }
}
```

### Schema Context Provider

```tsx
// Provides schema context to all GraphQL document components
export const GraphQLSchemaProvider: React.FC<{ children: React.ReactNode }> = (
  { children },
) => {
  const schema = usePolenSchema() // Hook into Polen's schema loading
  const routeGenerator = usePolenRouteGenerator()

  const resolver = useMemo(
    () => new PolenSchemaResolver(schema, routeGenerator),
    [schema, routeGenerator],
  )

  return (
    <GraphQLSchemaContext.Provider value={{ schema, resolver }}>
      {children}
    </GraphQLSchemaContext.Provider>
  )
}
```

## Routing Integration

### Navigation Integration

```tsx
const GraphQLDocument: React.FC<GraphQLDocumentProps> = ({
  children,
  options = {},
  onNavigate = useNavigate(), // Polen's router integration
}) => {
  // Component implementation uses Polen's navigation system
  const handleIdentifierClick = (referenceUrl: string) => {
    onNavigate(referenceUrl) // Uses Polen's router
  }

  // ...
}
```

### Reference Link Generation

```tsx
interface RouteGenerator {
  generateSchemaPath(schemaPath: string[]): string
  generateTypeReference(typeName: string): string
  generateFieldReference(typeName: string, fieldName: string): string
}

class PolenRouteGenerator implements RouteGenerator {
  generateSchemaPath(schemaPath: string[]): string {
    // Generate URLs that match Polen's schema documentation structure
    const [typeName, fieldName, ...rest] = schemaPath

    if (fieldName) {
      return `/schema/types/${typeName}#${fieldName}`
    }

    return `/schema/types/${typeName}`
  }
}
```

## Styling Integration

### Theme Inheritance

```tsx
// Leverages Polen's existing Shiki themes
const GraphQLDocument = ({ children }) => {
  const shikiTheme = usePolenShikiTheme() // Inherits from Polen's theme config

  const shikiHtml = useMemo(
    () =>
      useShikiHighlighter().highlight(children, 'graphql', {
        theme: shikiTheme,
      }),
    [children, shikiTheme],
  )

  return (
    <div className='graphql-document polen-code-block'>
      <pre dangerouslySetInnerHTML={{ __html: shikiHtml }} />
      {/* Interactive overlays */}
    </div>
  )
}
```

### CSS Integration

```css
/* Inherits from Polen's existing code block styles */
.graphql-document {
  @extend .polen-code-block;
  
  /* GraphQL-specific enhancements */
  .identifier-overlay {
    /* Interactive element styling */
    &.type { color: var(--graphql-type-color, #0066cc); }
    &.field { color: var(--graphql-field-color, #009900); }
    &.argument { color: var(--graphql-argument-color, #ff6600); }
  }
  
  .hover-tooltip {
    /* Consistent with Polen's tooltip styling */
    @extend .polen-tooltip;
  }
}
```

## Build-Time Integration

### Validation During Build

```tsx
// Integrate with Polen's build process
export const validateGraphQLDocuments = async (
  config: PolenConfig,
): Promise<ValidationReport> => {
  const schema = await loadSchema(config)
  const documents = await findGraphQLDocuments(config.paths.pages)

  const errors: ValidationError[] = []

  for (const doc of documents) {
    const ast = parse(doc.source)
    const validation = validateAgainstSchema(ast, schema)

    if (!validation.valid) {
      errors.push({
        filePath: doc.filePath,
        errors: validation.errors,
      })
    }
  }

  if (
    errors.length > 0 && config.graphqlDocuments.errorPolicy === 'fail-fast'
  ) {
    throw new Error(`GraphQL validation failed:\n${formatErrors(errors)}`)
  }

  return { errors, warnings: [] }
}
```

### Development Server Integration

```tsx
// Hot reload support for schema changes
export const GraphQLDocumentDevMiddleware = (server: ViteDevServer) => {
  // Watch schema files
  const schemaWatcher = chokidar.watch(config.schema.files)

  schemaWatcher.on('change', () => {
    // Invalidate schema cache
    clearSchemaCache()

    // Trigger re-validation of all GraphQL documents
    server.ws.send({
      type: 'custom',
      event: 'graphql-schema-changed',
    })
  })
}
```

## Component Export Integration

### Template Component Integration

```tsx
// Export through Polen's component system
// src/template/components/content/$.ts
export { GraphQLDocument } from './graphql-document/index.ts'

// src/exports/components.ts
export * from '#template/components/content/$'
```

### Auto-Import Configuration

```json
// package.json
{
  "imports": {
    "#template/components/content/$": "./src/template/components/content/$.ts"
  }
}
```

## Dependencies Integration

### Leverage Existing Dependencies

```typescript
// Uses Polen's existing dependencies where possible
import { usePolenConfig } from '#api/config' // Polen's configuration
import { useNavigate } from '#lib/router' // Polen's router
import { useShikiHighlighter } from '#singletons/shiki' // Polen's Shiki setup
import { parse, validate } from 'graphql' // Already in Polen
```

### New Dependencies (Minimal)

```json
{
  "dependencies": {
    // Only new dependency needed
    "gray-matter": "^4.0.0" // For parsing inline config (if not already present)
  }
}
```

## Configuration Integration

### Polen Config Extension

```typescript
// Extend Polen's configuration interface
interface PolenConfig {
  // ... existing config

  graphqlDocuments?: {
    validateOnBuild?: boolean
    errorPolicy?: 'fail-fast' | 'collect-all'
    ignoreList?: string[]

    // UI defaults
    foldable?: boolean
    hoverDocs?: boolean
    errorDisplay?: 'inline' | 'tooltip' | 'none'
  }
}
```

This integration strategy ensures the GraphQL Document Component feels like a natural part of Polen while leveraging existing infrastructure for maximum compatibility and minimal bundle impact.
