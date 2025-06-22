# GraphQL Document Component - Implementation Approaches

This component is focused on **read-only documentation use cases**. Future interactive features (execution, editing) may require different architectural choices.

## Implementation Landscape Analysis

### 1. Rich Text Editors (Full Featured)

#### Monaco Editor (VS Code engine)

```tsx
import { Editor } from '@monaco-editor/react'
<Editor
  language='graphql'
  value={code}
  options={{ readOnly: true }}
/>
```

**Pros:** Full IDE features, excellent GraphQL support, built-in hover/intellisense
**Cons:** Heavy bundle (~2MB), overkill for read-only docs, complex theming

#### CodeMirror 6

```tsx
import { EditorView } from '@codemirror/view'
import { graphql } from 'cm6-graphql'
<EditorView extensions={[graphql()]} />
```

**Pros:** Modular, lighter than Monaco, excellent extensibility
**Cons:** Still substantial bundle, complex setup for simple use cases

### 2. Syntax Highlighters + Custom Interactivity (Recommended)

#### Shiki + Custom Overlays

```tsx
// Base: Shiki-highlighted HTML
<pre><code dangerouslySetInnerHTML={shikiHtml} /></pre>
// Overlay: Invisible positioned elements for interactivity
<div className="overlay">
  {identifiers.map(id => (
    <span 
      style={{ position: 'absolute', left: id.x, top: id.y }}
      onClick={() => navigate(id.link)}
    />
  ))}
</div>
```

**Pros:** Lightweight, leverages existing Shiki, precise control
**Cons:** Complex positioning logic, manual hover/click handling

#### Prism + Token Manipulation

```tsx
const tokens = Prism.tokenize(code, Prism.languages.graphql)
return tokens.map(token =>
  isIdentifier(token)
    ? <Link to={getDocLink(token)}>{token}</Link>
    : <span>{token}</span>
)
```

**Pros:** Simple token-level control, lightweight
**Cons:** Limited GraphQL language support, manual AST correlation

### 3. DOM Manipulation Approaches

#### Post-process Shiki Output

```tsx
useEffect(() => {
  const codeElement = ref.current
  const identifiers = findGraphQLIdentifiers(code)

  identifiers.forEach(({ name, position }) => {
    const textNode = findTextNodeAtPosition(codeElement, position)
    wrapWithLink(textNode, name)
  })
}, [code])
```

**Pros:** Works with any highlighter, non-invasive
**Cons:** Fragile DOM manipulation, hydration issues

#### Custom AST → DOM Renderer

```tsx
const ast = parse(code, { kind: 'Document' })
const renderNode = (node) => {
  if (node.kind === 'Field') {
    return <span onClick={() => navigate(node.name)}>{node.name}</span>
  }
  // ... handle all GraphQL AST node types
}
```

**Pros:** Perfect semantic understanding, clean architecture
**Cons:** Substantial implementation, formatting preservation challenges

### 4. Hybrid Approaches

#### Textarea + Synchronized Overlay

```tsx
<div className='editor-container'>
  <textarea value={code} readOnly className='invisible-input' />
  <pre className='syntax-highlight'>{highlightedCode}</pre>
  <div className='interaction-layer'>{interactiveElements}</div>
</div>
```

**Pros:** Maintains text semantics, good accessibility
**Cons:** Complex synchronization, potential layout bugs

#### Web Components

```tsx
<graphql-document schema={schema} interactive>
  {code}
</graphql-document>
```

**Pros:** Encapsulation, framework agnostic, clean API
**Cons:** Limited React integration, shadow DOM complexity

## Interactive vs Read-Only: Complementary Approaches

### Why Keep Both Approaches

**Read-Only (Shiki + Overlays):**

- Documentation pages, examples, tutorials
- Fast loading, minimal JavaScript (~50KB vs ~2MB+)
- Perfect for static content where performance matters

**Interactive (Monaco Editor):**

- Query builders, schema explorers, playgrounds
- Rich editing experiences with intellisense
- When users need to modify/execute code

Different use cases have fundamentally different requirements. A blog post showing GraphQL examples doesn't need Monaco's weight, but a query playground absolutely does.

### Control Comparison: Shiki vs Monaco

**Identifier Control & Hyperlinking:**

| Feature              | Shiki + Overlays         | Monaco Editor            |
| -------------------- | ------------------------ | ------------------------ |
| **Bundle Size**      | ~50KB (GraphQL parser)   | ~2MB+                    |
| **Hover Control**    | Complete custom UI       | Monaco's tooltip format  |
| **Link Behavior**    | Any React navigation     | URL-based only           |
| **Styling**          | Full CSS control         | Monaco theme constraints |
| **Performance**      | Static HTML + minimal JS | Full editor engine       |
| **GraphQL Features** | Custom AST analysis      | Built-in language server |

**Shiki Approach - Maximum Control:**

```tsx
// Complete control - we build everything
const identifiers = extractFromAST(graphqlCode)
identifiers.forEach(id => {
  createOverlayLink(id, `/docs/schema/${id.typeName}`)
})
```

**Monaco Approach - Constrained by APIs:**

```tsx
// Must work within Monaco's provider system
monaco.languages.registerHoverProvider('graphql', {
  provideHover: (model, position) => {
    const word = model.getWordAtPosition(position)
    return { contents: [{ value: getDocumentation(word) }] }
  },
})

monaco.languages.registerLinkProvider('graphql', {
  provideLinks: (model) => {
    return identifiers.map(id => ({
      range: id.range,
      url: `/docs/schema/${id.typeName}`, // Limited to URLs
    }))
  },
})
```

### Hybrid Strategy Implementation

```tsx
const GraphQLBlock = ({ children, mode = 'readonly', ...config }) => {
  if (mode === 'interactive') {
    return <MonacoGraphQLEditor {...config}>{children}</MonacoGraphQLEditor>
  }

  return <ShikiGraphQLDocument {...config}>{children}</ShikiGraphQLDocument>
}
```

**Usage Examples:**

````markdown
```graphql
query ReadOnlyExample { ... }  # Fast, lightweight documentation
```
````

```graphql mode="interactive"
query EditableExample { ... }   # Full editor when needed
```

**Real-World Scenarios:**

- **Documentation Page**: Shiki + Overlays (lightweight, custom links)
- **Interactive Playground**: Monaco (full editing, intellisense, validation)
- **Tutorial with Exercises**: Hybrid (read-only examples + interactive exercises)

## Recommended Approach: Shiki + Interactive Overlays

### Why This Works Best for Polen:

1. **Leverages Existing Infrastructure**: Polen already uses Shiki
2. **Lightweight**: No additional editor dependencies
3. **Precise Control**: Can implement exact GraphQL semantics
4. **Performance**: Static highlighting + minimal JavaScript
5. **Theming**: Inherits existing Shiki themes seamlessly

### Implementation Strategy:

```tsx
const GraphQLDocument = ({ children, schema }) => {
  const ast = useMemo(() => parse(children), [children])
  const identifiers = useMemo(() => extractIdentifiers(ast), [ast])
  const shikiHtml = useMemo(() => highlightCode(children), [children])

  return (
    <div className='graphql-document'>
      {/* Base syntax highlighting */}
      <pre dangerouslySetInnerHTML={{ __html: shikiHtml }} />

      {/* Interactive overlay */}
      <div className='interaction-overlay'>
        {identifiers.map(id => (
          <InteractiveSpan
            key={id.position}
            identifier={id}
            schema={schema}
            position={calculatePosition(id.position)}
          />
        ))}
      </div>
    </div>
  )
}
```

This approach gives us the best balance of functionality, performance, and maintainability for a documentation-focused tool.
