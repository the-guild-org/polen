# GraphQL Document Component

Transform static GraphQL code blocks into interactive documentation with hyperlinks, tooltips, and schema validation.

## Overview

The GraphQL Document component enhances markdown code blocks with:

- **Hyperlinked identifiers** - Click to navigate to reference documentation
- **Hover tooltips** - View type information and descriptions
- **Schema validation** - Highlight errors and deprecations
- **Build-time checking** - Catch GraphQL errors during build

## Architecture

The implementation follows a layered architecture:

1. **Analysis Layer** - Parses GraphQL and extracts identifiers
2. **Schema Integration** - Resolves identifiers against GraphQL schema
3. **Positioning Engine** - Maps source positions to DOM coordinates
4. **UI Components** - React components for interactivity
5. **Orchestration** - Main component tying everything together
6. **Polen Integration** - Rehype plugin and build pipeline

## Usage

### Basic Setup

1. Add the rehype plugin to your MDX configuration:

```typescript
import { createPolenRehypePlugin } from 'polen/lib/graphql-document'

// In your pages plugin
rehypePlugins: ;
;[
  // ... other plugins
  createPolenRehypePlugin({
    schema: yourGraphQLSchema,
    validateAtBuildTime: true,
  }),
]
```

2. Use GraphQL code blocks in your markdown:

```markdown
\`\`\`graphql
query GetUser($id: ID!) {
user(id: $id) {
name
email
}
}
\`\`\`
```

### Options

Control behavior with language options:

- `\`\`\`graphql plain\`\`\` - Disable interactivity
- `\`\`\`graphql debug\`\`\` - Show debug overlays
- `\`\`\`graphql validate=false\`\`\` - Skip validation

### React Component

Use the component directly in React:

```tsx
import { GraphQLDocument } from 'polen/lib/graphql-document'

<GraphQLDocument schema={schema} options={{ debug: true }}>
  {`query { user { name } }`}
</GraphQLDocument>
```

## Implementation Details

### Key Components

- `GraphQLDocument` - Main React component
- `IdentifierLink` - Interactive overlay for identifiers
- `HoverTooltip` - Tooltip showing type information
- `rehypeGraphQLSimple` - MDX transformation plugin
- `PolenSchemaResolver` - Schema integration

### Testing

Run tests with:

```bash
pnpm test:unit src/lib/graphql-document
```

### Type Safety

Full TypeScript support with strict typing throughout.

## Future Enhancements

- Code folding for large queries
- Inline query execution
- Schema diff visualization
- Export to various formats
