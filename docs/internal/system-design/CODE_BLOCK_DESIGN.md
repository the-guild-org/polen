# Code Block Component Design for Polen

## Executive Summary

This document outlines the design for a robust code block component system with syntax highlighting for markdown content in Polen. The proposed solution leverages the Shiki ecosystem for its performance, extensibility, and active maintenance.

## Recommended Solution: Shiki + MDX Integration

### Core Stack

1. **Syntax Highlighter**: Shiki v1.0+
2. **MDX Integration**: @shikijs/rehype
3. **TypeScript Support**: @shikijs/twoslash
4. **Enhancement Transformers**: @shikijs/transformers

### Key Benefits

- ESM-first architecture with tree-shaking support
- TextMate grammar (VS Code engine) for accurate highlighting
- Zero JavaScript shipped for static sites (SSG mode)
- Active maintenance and strong ecosystem

## Architecture Options

### Option 1: Direct Shiki Integration (Recommended)

**Implementation Stack:**

- `shiki` (core highlighter)
- `@shikijs/rehype` (MDX integration)
- `@shikijs/twoslash` (TypeScript tooltips)
- `@shikijs/transformers` (line features)

**Pros:**

- Maximum control and customization
- Best performance with singleton pattern
- Native ESM support
- Direct access to all Shiki features
- Minimal dependencies

**Cons:**

- More implementation work required
- Need to manage highlighter lifecycle
- Custom CSS styling needed

**Key Resources:**

- [Shiki Documentation](https://shiki.style/)
- [Shiki Twoslash](https://github.com/shikijs/shiki/tree/main/packages/twoslash)
- [Shiki Transformers](https://shiki.style/guide/transformers)

### Option 2: rehype-pretty-code

**Implementation Stack:**

- `rehype-pretty-code` (wrapper around Shiki)
- Built-in MDX support
- Includes common transformers

**Pros:**

- Simpler setup with sensible defaults
- Built-in line highlighting features
- Better inline code support
- Data attributes for custom styling
- Well-documented API

**Cons:**

- Additional abstraction layer
- Less direct control over Shiki
- Slightly larger bundle size

**Key Resources:**

- [rehype-pretty-code GitHub](https://github.com/atomiks/rehype-pretty-code)
- [rehype-pretty-code Examples](https://rehype-pretty-code.netlify.app/)

## Theme Strategy

### Primary Theme: Tokyo Night

```typescript
const themes = {
  light: 'tokyo-night-light',
  dark: 'tokyo-night-storm', // or 'tokyo-night-moon'
}
```

### Implementation Approach

Use CSS variables for seamless theme switching:

```typescript
const html = await codeToHtml(code, {
  themes: {
    light: 'tokyo-night-light',
    dark: 'tokyo-night-storm',
  },
  defaultColor: false, // Let CSS handle the default
})
```

CSS:

```css
[data-theme="light"] {
  --shiki-light: initial;
  --shiki-dark: none;
}

[data-theme="dark"] {
  --shiki-light: none;
  --shiki-dark: initial;
}
```

## Feature Implementation

### 1. GraphQL Syntax Support

````typescript
// Register GraphQL grammar
await highlighter.loadLanguage('graphql')

// Use in code blocks
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
  }
}
````

### 2. Shiki Twoslash for TypeScript

```typescript
import { transformerTwoslash } from '@shikijs/twoslash'

const transformer = transformerTwoslash({
  renderer: 'rich', // or 'plain'
  twoslashOptions: {
    compilerOptions: {
      moduleResolution: 'bundler',
    },
  },
})
```

### 3. Line Numbers & Highlighting

```typescript
import {
  transformerNotationHighlight,
  transformerNotationLineNumbers,
} from '@shikijs/transformers'

const transformers = [
  transformerNotationLineNumbers(),
  transformerNotationHighlight(),
]
```

Usage in markdown:

```typescript
function example() { // [!code highlight]
  const value = 42 // [!code ++]
  return value
}
```

### 4. Performance Optimization

```typescript
// Singleton highlighter instance
let highlighter: Highlighter | null = null

export async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['tokyo-night-storm', 'tokyo-night-light'],
      langs: ['typescript', 'graphql', 'javascript', 'jsx', 'tsx'],
    })
  }
  return highlighter
}

// Implement caching for repeated code blocks
const cache = new Map<string, string>()
```

## IDE Support for Markdown Authors

### TypeScript Support in Code Blocks

1. **VSCode Extension**: Use "MDX" extension for syntax highlighting
2. **Type Checking**: Configure tsconfig.json to include markdown files

### Example VSCode Settings

```json
{
  "mdx.validate.enabled": true,
  "mdx.format.enabled": true,
  "[mdx]": {
    "editor.defaultFormatter": "unifiedjs.vscode-mdx"
  }
}
```

## Implementation Roadmap

### Phase 1: Core Integration

1. Install and configure Shiki with rehype
2. Implement singleton highlighter pattern
3. Add Tokyo Night theme support
4. Basic GraphQL and TypeScript highlighting

### Phase 2: Enhanced Features

1. Add Shiki Twoslash for TypeScript tooltips
2. Implement line numbers and highlighting
3. Add theme switching with CSS variables
4. Performance optimization with caching

### Phase 3: Developer Experience

1. Configure IDE support for markdown authors
2. Add custom transformers for Polen-specific features
3. Documentation and examples
4. Performance monitoring and optimization

## Performance Considerations

### Build Time

- Use highlighter caching for 80% faster builds
- Implement worker threads for parallel processing
- Cache highlighted output by content hash

### Runtime

- Ship zero JavaScript for SSG mode
- Lazy-load grammars and themes on demand
- Use fine-grained imports to reduce bundle size

### Bundle Size Optimization

```typescript
// Instead of importing all languages
import { createHighlighter } from 'shiki'

// Use fine-grained imports
import { createHighlighter } from 'shiki/core'
import graphqlGrammar from 'shiki/langs/graphql.mjs'
import typescriptGrammar from 'shiki/langs/typescript.mjs'
```

## Alternative Considerations

### Prism.js

- **Pros**: Smaller bundle, plugin ecosystem
- **Cons**: Less accurate highlighting, no native Twoslash support
- **Use Case**: If bundle size is critical and accuracy is less important

### CodeMirror 6

- **Pros**: Full editor capabilities, real-time highlighting
- **Cons**: Larger bundle, complexity overhead
- **Use Case**: If interactive editing is needed

## Conclusion

The recommended approach using Shiki with MDX integration provides:

- Accurate VS Code-quality syntax highlighting
- Excellent TypeScript and GraphQL support
- Performance optimization opportunities
- Active maintenance and strong ecosystem
- Full ESM and TypeScript support

This solution aligns with Polen's requirements for a delightful developer portal experience while maintaining high performance and customization capabilities.

## References

- [Shiki Official Documentation](https://shiki.style/)
- [Tokyo Night Theme](https://github.com/enkia/tokyo-night-vscode-theme)
- [MDX Integration Guide](https://mdxjs.com/guides/syntax-highlighting/)
- [Twoslash Documentation](https://twoslash.netlify.app/)
- [rehype-pretty-code](https://github.com/atomiks/rehype-pretty-code)
