# GraphQL Document Component - Configuration

## Component Interface

```tsx
<GraphQLDocument
  schema={schemaContext}
  options={{
    validateOnBuild: true,
    ignoreList: ['SomeExternalType'],
    foldable: true,
    errorDisplay: 'inline' | 'tooltip',
  }}
>
  {graphqlString}
</GraphQLDocument>
```

## Configuration Options

```typescript
interface GraphQLDocumentOptions {
  // Validation
  validateOnBuild: boolean
  ignoreList: string[]
  errorPolicy: 'fail-fast' | 'collect-all'

  // UI Features
  foldable: boolean
  hoverDocs: boolean
  errorDisplay: 'inline' | 'tooltip' | 'none'

  // Styling
  theme: 'inherit' | 'graphql-semantic'
  linkStyle: 'underline' | 'color' | 'both'
}
```

## Inline Configuration Syntax

Following established standards from Docusaurus/Nextra, configuration options can be specified inline in the code block language meta string:

### Basic Examples

````markdown
```graphql plain=true validate=false title="Simple Query"
query GetUser { user { name } }
```
````

```graphql filename="user-mutations.gql" foldable=false
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) { id name }  
}
```

```graphql ignoreList="ExternalType,LegacyField" showLineNumbers
query GetData {
  internalField
  externalField  # Won't show validation error
}
```

```graphql {1,3-5} title="Line Highlighting Example"
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
    profile { avatar }
  }
}
```

````
### Configuration Reference

#### Boolean Options
- `plain=true` - Disable all interactive features, render as regular code block
- `validate=false` - Skip GraphQL validation against schema  
- `showLineNumbers` - Enable line numbering
- `foldable=false` - Disable code folding features

#### String Options
- `title="Custom Title"` - Display custom title above code block
- `filename="query.gql"` - Display filename (alternative to title)
- `ignoreList="Type1,Type2"` - Comma-separated list of identifiers to ignore in validation
- `errorDisplay="tooltip"` - How to display validation errors (`inline`, `tooltip`, `none`)

#### Standard Syntax
- `{1,3-5}` - Highlight specific lines (follows standard markdown syntax)

## Build-Time Configuration

### Global Configuration

```typescript
// In polen.config.ts
export default defineConfig({
  graphqlDocuments: {
    validateOnBuild: true,
    errorPolicy: 'collect-all',
    ignoreList: ['LegacyType', 'ExternalService'],
    
    // UI defaults
    foldable: true,
    hoverDocs: true,
    errorDisplay: 'inline',
    
    // Styling
    theme: 'inherit',
    linkStyle: 'both'
  }
})
````

### Per-Page Configuration

````markdown
---
graphqlDocuments:
  validate: false
  ignoreList: ['TestType']
---

# This page has custom GraphQL document settings

```graphql
query TestQuery {
  testField  # Won't validate due to page-level settings
}
```
````

````
### Environment-Specific Configuration

```typescript
// Development: More lenient validation
if (process.env.NODE_ENV === 'development') {
  config.graphqlDocuments.errorPolicy = 'collect-all'
  config.graphqlDocuments.validateOnBuild = false
}

// Production: Strict validation
if (process.env.NODE_ENV === 'production') {
  config.graphqlDocuments.errorPolicy = 'fail-fast'
  config.graphqlDocuments.validateOnBuild = true
}
````

## Validation Configuration

### Error Policies

#### `fail-fast`

- Stop build immediately on first validation error
- Best for CI/CD pipelines where quick feedback is important
- Recommended for production builds

#### `collect-all`

- Collect all validation errors before failing build
- Log errors during build for feedback on long builds
- Better developer experience during development

### Ignore Lists

Ignore lists help handle expected missing identifiers:

````typescript
// Global ignore list
ignoreList: [
  'ExternalType',      // Types from external schemas
  'LegacyField',       // Deprecated fields still in docs
  'FutureFeature',     // Planned features not yet implemented
]

// Inline ignore list
```graphql ignoreList="ExternalType,LegacyField"
query MixedQuery {
  internalField
  externalField    # Ignored
  legacyField      # Ignored
}
````

````
### Validation Levels

```typescript
interface ValidationConfig {
  level: 'strict' | 'moderate' | 'lenient'
  
  // Strict: All identifiers must exist in schema
  // Moderate: Allow deprecated fields with warnings
  // Lenient: Only error on completely unknown identifiers
}
````

## Styling Configuration

### Theme Options

#### `inherit` (default)

Uses existing Shiki themes with minimal GraphQL-specific modifications

#### `graphql-semantic`

Custom color scheme optimized for GraphQL concepts:

- Types: Blue
- Fields: Green
- Arguments: Orange
- Directives: Purple

### Link Styling

#### `underline`

Traditional underlined links

#### `color`

Color-coded links without underlines

#### `both`

Colored links with subtle underlines

## Performance Configuration

```typescript
interface PerformanceConfig {
  // Cache parsed ASTs for repeated documents
  cacheAst: boolean

  // Debounce position recalculation on resize
  debounceResize: number // milliseconds

  // Maximum document size for full analysis
  maxDocumentSize: number // characters
}
```
