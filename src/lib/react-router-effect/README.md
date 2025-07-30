# React Router Effect

Automatic codec support for React Router using Effect schemas.

## Overview

This library provides seamless integration between React Router's data loading system and Effect's schema system. It enables:

- **Automatic encoding/decoding** of loader data using Effect schemas
- **Type-safe data access** in components
- **Flexible data retrieval** from any route in the hierarchy
- **Zero manual serialization** - never see encoded forms in your app code

## Quick Start

```typescript
import {
  schemaRoute,
  useLoaderData,
} from '#lib/react-router-effect/react-router-effect'
import { CatalogSchema } from './schemas'

// Define a route with a schema
export const catalogRoute = schemaRoute({
  path: '/catalog/:id',
  schema: CatalogSchema,
  loader: async ({ params }) => {
    const catalog = await fetchCatalog(params.id)
    return catalog // Automatically encoded using the schema
  },
  Component: CatalogView,
})

// Access decoded data in your component
function CatalogView() {
  const catalog = useLoaderData(CatalogSchema) // Automatically decoded!
  return <h1>{catalog.name}</h1>
}
```

## Core Concepts

### Schema Attachment

Routes can have Effect schemas attached via the `handle` property:

```typescript
const route = schemaRoute({
  schema: MySchema,
  // ... other route config
})
```

### Automatic Codec

- **In loaders**: Return decoded data - it's automatically encoded for transport
- **In components**: Receive decoded data - encoding/decoding is transparent

### Flexible Data Access

```typescript
// Get current route's data
const data = useLoaderData(CurrentSchema)

// Get ancestor route's data
const parentData = useLoaderData(ParentSchema)

// Get data by route ID (requires type augmentation)
const specificData = useRouteDataById('routeId')

// Get all route data at once
const allData = useRouteData()
```

## API Reference

### `schemaRoute(config)`

Creates a route with an attached Effect schema.

```typescript
const route = schemaRoute({
  id: 'my-route',
  path: '/path',
  schema: MySchema,
  loader: async (args) => data,
  Component: MyComponent,
})
```

### `useLoaderData(schema)`

Retrieves and decodes data from any route with the matching schema.

```typescript
const data = useLoaderData(MySchema)
```

### `useRouteDataById(routeId)`

Type-safe data access by route ID (requires registry augmentation).

```typescript
// First, augment the registry
declare module '#lib/react-router-effect/types' {
  interface RouteSchemaRegistry {
    'my-route': typeof MySchema
  }
}

// Then use type-safe access
const data = useRouteDataById('my-route')
```

### `useRouteData()`

Returns all route data from the current hierarchy, decoded.

```typescript
const allData = useRouteData()
// Access: allData.routeId
```

### `createEffectLoader(schema, loader)`

Lower-level API for creating loaders with automatic encoding.

```typescript
const loader = createEffectLoader(MySchema, async ({ params }) => {
  return await fetchData(params.id)
})
```

## Migration from superjson

Before:

```typescript
const loader = createLoader(async ({ params }) => {
  const data = await fetchData(params.id)
  return superjson.stringify(data)
})

// In component
const encodedData = useLoaderData()
const data = superjson.parse(encodedData)
```

After:

```typescript
const route = schemaRoute({
  schema: DataSchema,
  loader: async ({ params }) => {
    return await fetchData(params.id) // No manual encoding!
  },
})

// In component
const data = useLoaderData(DataSchema) // Already decoded!
```

## Type Safety

The library provides full TypeScript inference:

- Route parameters are typed based on path
- Loader data is typed based on schema
- Components receive correctly typed props
- Route IDs can be made type-safe via registry

## Benefits

1. **Decentralized** - Each route owns its schema
2. **Transparent** - Encoding/decoding happens automatically
3. **Type-safe** - Full TypeScript support
4. **Flexible** - Access data from any route
5. **Compatible** - Works alongside existing React Router code
