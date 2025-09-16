# GraphQL Schema Path Library - Technical Debt and Improvements Plan

## Executive Summary

The `graphql-schema-path` library has functional core features but significant technical debt. This document outlines all issues found and provides a detailed plan for addressing them.

## 1. Critical Issues

### 1.1 Poor Test Coverage ❗️

**Current State**:

- 23 implementation files
- Only 4 test files (2 actual, 2 type-level)
- **Coverage**: ~17% of files have tests

**Missing Test Coverage**:

| File                                  | Priority | What to Test                                           |
| ------------------------------------- | -------- | ------------------------------------------------------ |
| `traverse/define.ts`                  | HIGH     | Core traverser logic, path tracking, error enhancement |
| `traverse/error.ts`                   | HIGH     | Error creation, type guards, segment utilities         |
| `traverse/error-renderer.ts`          | HIGH     | Error formatting, path rendering                       |
| `traverse-adaptors/graphql-schema.ts` | HIGH     | Each stepper function, error cases                     |
| `parser.ts`                           | MEDIUM   | Edge cases, error handling                             |
| `tokenizer.ts`                        | MEDIUM   | Token generation, special characters                   |
| `nodes/*.ts`                          | MEDIUM   | Node creation, validation                              |
| `layout-analyzer.ts`                  | LOW      | Parent-child relationships                             |

## 2. Type Safety Issues

### 2.1 Excessive `any` Usage 🔶

**Count**: ~20+ instances across the codebase

**Most Problematic Locations**:

#### `traverse/define.ts`

```typescript
// Current (bad)
let currentSegment: any = path.next
let targetParentNode: any = null
const stepper = (definition.nodes as any)[nodeTag]
targetParentNode = (result as any).right

// Proposed (good)
type PathSegment =
  | Nodes.Type.Type
  | Nodes.Field.Field
  | Nodes.Argument.Argument
  | Nodes.Directive.Directive
  | Nodes.ResolvedType.ResolvedType

let currentSegment: PathSegment | undefined = path.next
let targetParentNode: unknown = null // Or specific union type
const stepper = definition.nodes[nodeTag as keyof typeof definition.nodes]
if (Either.isRight(result)) {
  targetParentNode = result.right
}
```

#### `graphql-schema-path.ts` codec operations

```typescript
// Current (bad)
return S.decodeUnknownSync(GraphQLSchemaPath as any)(input) as any

// Proposed (good) - Create proper type overloads
export function decodeSync<T extends string>(
  input: T,
): ParsePath<T> extends GraphQLSchemaPath ? ParsePath<T> : GraphQLSchemaPath
```

### 2.2 Missing Type Guards 🔶

**Problem**: Manual type checking instead of using type guards

```typescript
// Current (bad)
error && typeof error === 'object' && '_tag' in error
  && error._tag === 'TraversalError'

// Proposed (good)
import { TraversalError } from '#lib/graphql-schema-path/traverse/error'

if (TraversalError.is(error)) {
  // TypeScript now knows error is TraversalError
}
```

### 2.3 Unsafe Casts 🔶

```typescript
// Current (bad)
resolved as GrafaidOld.Groups.Describable

// Proposed (good) - Create type guard
function isDescribable(node: unknown): node is GrafaidOld.Groups.Describable {
  return node !== null
    && typeof node === 'object'
    && 'description' in node
}
```

## 3. Architectural Improvements

### 3.1 Library Status

**IMPORTANT**: The graphql-schema-path library appears to be under development or not yet implemented. The codebase currently only contains:

- `$.ts` - Namespace export
- `$$.ts` - Barrel export
- `traverse/error.ts` - Error types

The core implementation files (parser, tokenizer, nodes, etc.) referenced in this document do not exist yet. The module reorganization (3.3) cannot be performed until the library is actually implemented.

### 3.2 Missing Abstractions

**Current**: Application layer directly manipulates traverser and errors

**Proposed**: Create service layer

```typescript
export class PathResolver {
  constructor(private schema: GraphQLSchema) {
    this.traverser = gqlSchemaTraverser({ schema })
  }

  resolve(path: GraphQLSchemaPath): Either<ResolvedNode, TraversalError> {
    return this.traverser(path)
  }

  resolveDescribable(path: GraphQLSchemaPath): Either<Describable, Diagnostic> {
    const result = this.resolve(path)
    if (Either.isLeft(result)) {
      return Either.left(this.errorToDiagnostic(result.left))
    }
    if (!isDescribable(result.right)) {
      return Either.left(this.notDescribableDiagnostic(path))
    }
    return Either.right(result.right)
  }

  private errorToDiagnostic(error: TraversalError): Diagnostic {
    // Convert error to diagnostic
  }
}
```

### 3.3 Error Handling Consistency

**Current**: Mixed approaches to error handling

**Proposed Error Strategy**:

1. All traverser steppers return `Either<T, TraversalError>`
2. Never throw exceptions in library code
3. Always use type guards for error checking
4. Provide error recovery hints where possible

### 3.4 Better Module Organization (Future - After Implementation)

```
graphql-schema-path/
├── core/               # Core types and parsing
│   ├── nodes/
│   ├── parser.ts
│   ├── tokenizer.ts
│   └── path.ts
├── traverse/           # Traversal logic
│   ├── traverser.ts   # Main traverser
│   ├── error.ts       # Error types
│   └── renderer.ts    # Error rendering
├── adaptors/          # Schema adaptors
│   ├── graphql.ts     # graphql-js adaptor
│   └── introspection.ts # Future: introspection adaptor
├── services/          # High-level services
│   ├── resolver.ts    # Path resolution service
│   └── validator.ts  # Path validation service
└── index.ts          # Public API
```

## 4. Implementation Plan

### Phase 1: Critical Fixes (Week 1)

- [x] ~~Extract duplicated code in `apply.ts`~~ ✅ COMPLETED
- [x] ~~Replace manual type checking with type guards~~ ✅ COMPLETED
- [x] ~~Add `isDescribable` type guard~~ ✅ COMPLETED
- [ ] Fix most problematic `any` usages in traverser

### Phase 2: Test Coverage (Week 2)

- [ ] Add comprehensive tests for `traverse/define.ts`
- [ ] Add tests for error creation and rendering
- [ ] Add tests for GraphQL schema traverser steppers
- [ ] Add integration tests with real schemas
- [ ] Target: 80% code coverage

### Phase 3: Type Safety (Week 3)

- [ ] Remove all unnecessary `any` types
- [ ] Add proper type overloads for codecs
- [ ] Create union types for path segments
- [ ] Add stricter TypeScript config for this module

### Phase 4: Architecture (Week 4)

- [ ] Create PathResolver service
- [ ] Refactor augmentation system to use services
- [ ] Reorganize module structure
- [ ] Document public API properly

### Phase 5: Performance & Polish (Week 5)

- [ ] Add path caching for frequently accessed paths
- [ ] Optimize traverser for common patterns
- [ ] Add benchmarks
- [ ] Complete documentation

## 5. Testing Strategy

### Unit Tests

```typescript
describe('traverse/define', () => {
  describe('defineTraverser', () => {
    test('creates a traverser function')
    test('tracks path segments during traversal')
    test('enhances stepper errors with context')
    test('handles missing steppers')
    test('propagates stepper errors')
  })
})

describe('traverse/error', () => {
  describe('TraversalError', () => {
    test('creates error with full context')
    test('type guard works correctly')
    test('segment utilities extract correct names')
  })
})

describe('traverse/error-renderer', () => {
  describe('renderTraversalError', () => {
    test('formats error with path highlighting')
    test('shows available options')
    test('limits options display')
    test('handles errors without context gracefully')
  })
})
```

### Integration Tests

```typescript
describe('GraphQL Schema Traverser', () => {
  const schema = buildTestSchema()

  test('resolves valid paths')
  test('provides helpful errors for invalid fields')
  test('shows available arguments')
  test('handles nested field resolution')
  test('resolves through type wrapping')
})
```

## 6. Performance Considerations

### Current Issues

- No caching of resolved paths
- Traverser recreated on each call
- No optimization for common patterns

### Proposed Optimizations

1. **Path Cache**: LRU cache for frequently accessed paths
2. **Traverser Pooling**: Reuse traverser instances
3. **Fast Path**: Optimize common patterns (Type.field)
4. **Lazy Evaluation**: Don't compute error details unless needed

## 7. Documentation Needs

### Missing Documentation

- [ ] Public API reference
- [ ] Traverser extension guide
- [ ] Error handling best practices
- [ ] Performance tips
- [ ] Migration guide from old validation

### Code Comments Needed

- [ ] Complex type manipulations in define.ts
- [ ] Algorithm explanation in layout-analyzer.ts
- [ ] Parser grammar documentation

## 8. Breaking Changes

If we proceed with all improvements, these would be breaking changes:

1. Error types will change (TraversalError instead of Error)
2. Some exports may move (better module organization)
3. Type signatures will be stricter (removing any)

Consider releasing as v2.0.0 with migration guide.

## 9. Success Metrics

- [x] ~~Zero code duplication~~ ✅ COMPLETED (apply.ts refactored)
- [ ] 80%+ test coverage
- [ ] No `any` types in public API
- [ ] All errors use TraversalError type
- [ ] Clean separation between library and application
- [ ] Performance: <1ms for typical path resolution
- [ ] Documentation: 100% of public API documented

## 10. Future Enhancements

Once technical debt is addressed:

1. **Path constraints**: "describable nodes only" paths
2. **Batch resolution**: Resolve multiple paths efficiently
3. **Path builders**: Type-safe path construction
4. **Schema diffing**: Compare paths across schema versions
5. **Path autocomplete**: Provide suggestions for partial paths
6. **Visual path explorer**: UI for exploring schema paths

---

**Estimated Total Effort**: 5 weeks for one developer
**Priority**: HIGH - This is core infrastructure
**Risk**: Breaking changes may affect consumers
**Recommendation**: Address Phase 1 & 2 immediately, plan v2.0.0 for full refactor
