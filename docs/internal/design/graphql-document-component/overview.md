# GraphQL Document Component - Overview

## Summary

An interactive MDX component for displaying GraphQL documents (queries, mutations, subscriptions) with enhanced developer experience features including hyperlinked identifiers, hover documentation, error handling, and code folding.

## Goals

- Transform static GraphQL code blocks into interactive documentation
- Provide seamless navigation between GraphQL documents and schema reference
- Surface identifier documentation without leaving the current page
- Validate GraphQL documents against the schema with helpful error reporting
- Integrate transparently with existing markdown/MDX workflow

## Core Features

### 1. Identifier Hyperlinking

All GraphQL identifiers (types, fields, arguments, directives) become clickable links that navigate to their respective reference documentation pages.

```graphql
query GetUser($id: ID!) {
  user(id: $id) {    # 'user' links to User type docs
    name             # 'name' links to User.name field docs
    email            # 'email' links to User.email field docs
  }
}
```

### 2. Hover Documentation

On hover, identifiers display tooltips showing their documentation, type information, and other relevant metadata from the GraphQL schema.

### 3. Error Handling

#### UI Error Display

Missing or invalid identifiers are visually highlighted with error styling and explanatory tooltips.

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    nonExistentField  # ❌ Highlighted as error with tooltip
  }
}
```

#### Build-Time Validation

- Collect all validation errors before failing build
- Log errors during build for feedback on long builds
- Configurable policies for error handling
- Support ignore lists for expected missing identifiers

### 4. Code Folding

#### Operation Level

```graphql
▼ query GetUser($id: ID!) { ... }     # Collapsible operations
▼ mutation UpdateUser { ... }
```

#### Field Level (within operations)

```graphql
query GetUser($id: ID!) {
  ▼ user(id: $id) { ... }             # Collapsible field selections
  ▼ posts(first: 10) { ... }
  simpleField                         # No folding for scalars
}
```

#### Nested Support

Field folding works recursively for deeply nested selections.

### 5. Automatic Integration

Any ````graphql` code block in markdown automatically becomes an interactive GraphQL document component.

### 6. Inline Configuration

Following established standards from Docusaurus/Nextra, configuration options can be specified inline:

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

```
#### Supported Configuration Options:

- `plain=true` - Disable interactive features, render as regular code block
- `validate=false` - Skip GraphQL validation against schema  
- `title="Custom Title"` - Display custom title above code block
- `filename="query.gql"` - Display filename (alternative to title)
- `showLineNumbers` - Enable line numbering
- `foldable=false` - Disable code folding features
- `ignoreList="Type1,Type2"` - Comma-separated list of identifiers to ignore in validation
- `{1,3-5}` - Highlight specific lines (standard syntax)

## Related Documents

- [Implementation Architecture](./architecture.md) - Detailed technical implementation
- [Implementation Approaches](./implementation-approaches.md) - Comparison of different technical approaches
- [Configuration](./configuration.md) - Complete configuration reference
- [Polen Integration](./polen-integration.md) - How this integrates with Polen's existing systems
```
