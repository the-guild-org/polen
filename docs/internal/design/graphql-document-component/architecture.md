# GraphQL Document Component - Architecture

## Detailed Architecture: Layered Implementation

### Layer 1: GraphQL Analysis Foundation

```tsx
// Core GraphQL parsing and analysis
interface GraphQLAnalyzer {
  parse(source: string): DocumentNode
  extractIdentifiers(ast: DocumentNode): IdentifierMap
  validateAgainstSchema(
    ast: DocumentNode,
    schema: GraphQLSchema,
  ): ValidationResult
}

interface Identifier {
  name: string
  kind: 'Type' | 'Field' | 'Argument' | 'Directive' | 'Variable'
  position: { start: number; end: number; line: number; column: number }
  parentType?: string
  schemaPath: string[] // e.g., ['User', 'posts', 'title']
}

interface IdentifierMap {
  byPosition: Map<number, Identifier>
  byKind: Map<Identifier['kind'], Identifier[]>
  errors: Array<{ identifier: Identifier; message: string }>
}
```

### Layer 2: Schema Integration

```tsx
// Bridge between GraphQL analysis and Polen's schema system
interface SchemaResolver {
  resolveIdentifier(identifier: Identifier): SchemaResolution | null
  getDocumentation(schemaPath: string[]): Documentation | null
  generateReferenceLink(schemaPath: string[]): string
}

interface SchemaResolution {
  exists: boolean
  deprecated?: { reason: string; replacement?: string }
  documentation?: Documentation
  referenceUrl: string
}

interface Documentation {
  description?: string
  examples?: string[]
  typeInfo: string // e.g., "String!" or "[User!]!"
}

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
}
```

### Layer 3: Positioning & Layout Engine

```tsx
// Maps GraphQL AST positions to DOM coordinates
interface PositionCalculator {
  calculateOverlayPosition(
    identifier: Identifier,
    containerElement: HTMLElement,
  ): DOMPosition

  recalculateOnResize(containerElement: HTMLElement): void
}

interface DOMPosition {
  top: number
  left: number
  width: number
  height: number
}

class ShikiPositionCalculator implements PositionCalculator {
  calculateOverlayPosition(
    identifier: Identifier,
    container: HTMLElement,
  ): DOMPosition {
    // Complex logic to map source positions to rendered DOM
    const textNodes = this.findTextNodes(container)
    const targetNode = this.findNodeAtPosition(
      textNodes,
      identifier.position.start,
    )
    const range = document.createRange()
    range.setStart(targetNode, identifier.position.start)
    range.setEnd(targetNode, identifier.position.end)

    const rect = range.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    return {
      top: rect.top - containerRect.top,
      left: rect.left - containerRect.left,
      width: rect.width,
      height: rect.height,
    }
  }
}
```

### Layer 4: Interactive UI Components

```tsx
// Individual interactive elements
interface InteractiveIdentifier {
  identifier: Identifier
  resolution: SchemaResolution
  position: DOMPosition
  onNavigate: (url: string) => void
}

const IdentifierLink: React.FC<InteractiveIdentifier> = ({
  identifier,
  resolution,
  position,
  onNavigate,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`identifier-overlay ${identifier.kind.toLowerCase()}`}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        cursor: resolution.exists ? 'pointer' : 'default',
      }}
      onClick={() => resolution.exists && onNavigate(resolution.referenceUrl)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && resolution.documentation && (
        <HoverTooltip
          documentation={resolution.documentation}
          position={position}
        />
      )}
      {!resolution.exists && <ErrorIndicator identifier={identifier} />}
    </div>
  )
}
```

### Layer 5: Orchestration Layer

```tsx
// Main component that coordinates all layers
const GraphQLDocument: React.FC<GraphQLDocumentProps> = ({
  children,
  schema,
  options = {},
  onNavigate = useNavigate(), // Polen's router integration
}) => {
  // Layer 1: Parse and analyze
  const analyzer = useMemo(() => new GraphQLAnalyzer(), [])
  const ast = useMemo(() => analyzer.parse(children), [children, analyzer])
  const identifiers = useMemo(() => analyzer.extractIdentifiers(ast), [
    ast,
    analyzer,
  ])

  // Layer 2: Resolve against schema
  const resolver = useMemo(
    () => new PolenSchemaResolver(schema, useRouteGenerator()),
    [schema],
  )
  const resolutions = useMemo(
    () =>
      identifiers.byPosition.forEach((id, pos) =>
        resolver.resolveIdentifier(id)
      ),
    [identifiers, resolver],
  )

  // Layer 3: Calculate positions
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null)
  const positionCalculator = useMemo(() => new ShikiPositionCalculator(), [])
  const positions = useMemo(() => {
    if (!containerRef) return new Map()
    return new Map(
      Array.from(identifiers.byPosition.entries()).map(([pos, id]) => [
        pos,
        positionCalculator.calculateOverlayPosition(id, containerRef),
      ]),
    )
  }, [identifiers, containerRef, positionCalculator])

  // Existing Shiki highlighting (leverages Polen's setup)
  const shikiHtml = useMemo(
    () => useShikiHighlighter().highlight(children, 'graphql'),
    [children],
  )

  return (
    <div className='graphql-document' ref={setContainerRef}>
      {/* Layer: Static highlighting */}
      <pre
        className='shiki-base'
        dangerouslySetInnerHTML={{ __html: shikiHtml }}
      />

      {/* Layer: Interactive overlays */}
      <div className='interaction-overlay'>
        {Array.from(identifiers.byPosition.entries()).map(
          ([pos, identifier]) => {
            const resolution = resolutions.get(pos)
            const position = positions.get(pos)

            if (!resolution || !position) return null

            return (
              <IdentifierLink
                key={pos}
                identifier={identifier}
                resolution={resolution}
                position={position}
                onNavigate={onNavigate}
              />
            )
          },
        )}
      </div>
    </div>
  )
}
```

### Layer 6: Polen Integration

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

## Architectural Benefits

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Each layer can be tested in isolation
3. **Extensibility**: New features (folding, execution) can be added as new layers
4. **Performance**: Expensive operations (AST parsing, position calculation) are memoized
5. **Polen Integration**: Leverages existing infrastructure (Shiki, routing, schema loading)
6. **Error Boundaries**: Each layer can handle its own error cases gracefully

## Implementation Phases

### Phase 1: Basic Component

- GraphQL AST parsing
- Syntax highlighting with Shiki
- Basic identifier detection
- Error UI rendering

### Phase 2: Schema Integration

- Schema context integration
- Link generation to reference pages
- Hover documentation tooltips
- Identifier validation

### Phase 3: Pipeline Integration

- Rehype plugin for automatic transformation
- Schema context propagation through build pipeline
- Error collection and reporting

### Phase 4: Advanced Features

- Code folding implementation (operation + field level)
- Build-time validation with policy options
- Performance optimizations for large documents
