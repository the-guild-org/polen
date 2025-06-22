# GraphQL Document Component Design

This directory contains the complete design specification for Polen's interactive GraphQL document component.

## Overview

An MDX component that transforms static GraphQL code blocks into interactive documentation with hyperlinked identifiers, hover documentation, validation, and advanced features.

## Document Structure

### [📋 Overview](./overview.md)

- Goals and core features
- Basic usage examples
- Configuration syntax

### [🏗️ Architecture](./architecture.md)

- Detailed 6-layer implementation architecture
- Interface definitions and data flow
- Implementation phases

### [⚖️ Implementation Approaches](./implementation-approaches.md)

- Comparison of technical approaches (Monaco vs Shiki vs others)
- Read-only vs interactive strategy
- Performance and control trade-offs

### [⚙️ Configuration](./configuration.md)

- Complete configuration reference
- Inline syntax options
- Build-time and runtime configuration

### [🔗 Polen Integration](./polen-integration.md)

- How this integrates with Polen's existing systems
- Build pipeline integration
- Schema and routing integration

### [🚀 Future Features](./future-features.md)

- Planned enhancements and roadmap
- Interactive execution and editing
- Advanced documentation features

## Quick Reference

### Basic Usage

````markdown
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
  }
}
```
````

````
### With Configuration
```markdown
```graphql title="User Query" validate=false foldable=false
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
  }
}
````

````
### Interactive Mode (Future)
```markdown
```graphql mode="interactive" endpoint="https://api.example.com/graphql"
query GetUser($id: ID!) {
  user(id: $id) {
    name
    email
  }
}
````

```
## Key Decisions

1. **Hybrid Strategy**: Separate read-only (Shiki) and interactive (Monaco) implementations
2. **Layered Architecture**: 6-layer design for modularity and testability  
3. **Polen Integration**: Leverage existing infrastructure (Shiki, routing, schema)
4. **Standard Syntax**: Follow Docusaurus/Nextra patterns for configuration
5. **Performance First**: Optimize for documentation use cases

## Implementation Status

- ✅ **Design Complete**: Comprehensive specification finished
- ⏳ **Implementation**: Awaiting development start
- ⏳ **Integration**: Polen pipeline integration pending
- ⏳ **Testing**: Component testing framework needed

## Dependencies

- `graphql` - AST parsing and validation
- `@shikijs/rehype` - Syntax highlighting (existing in Polen)
- Polen's schema system (existing)
- Polen's routing system (existing)

## Success Metrics

- Seamless integration with existing Polen workflow
- Improved documentation navigation experience
- Build-time validation catching errors early
- Minimal performance impact on existing sites
```
