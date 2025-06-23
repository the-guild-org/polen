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
6. **Polen Integration** - Virtual modules and Vite plugin

## Usage

### Basic Setup

1. Import the component in your MDX files:

```typescript
import { GraphQLDocumentWithSchema } from 'polen/components'
```

2. Use the component with GraphQL documents:

```mdx
<GraphQLDocumentWithSchema>
{`query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
  }
}`}
</GraphQLDocumentWithSchema>
```

### Component Props

The `GraphQLDocumentWithSchema` component automatically loads the schema from Polen's virtual modules. You can pass options:

```mdx
<GraphQLDocumentWithSchema 
  options={{ 
    debug: true,
    onNavigate: (url) => console.log('Navigate to:', url)
  }}
>
{`query { user { name } }`}
</GraphQLDocumentWithSchema>
```

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
- `GraphQLDocumentWithSchema` - Wrapper that loads schema from Polen
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
