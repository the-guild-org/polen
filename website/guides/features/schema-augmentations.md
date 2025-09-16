# Schema Augmentations

::: info
This page assumes basic knowledge of schema configuration concepts. See [Schema Overview](/guides/features/schema-overview) for foundational information.
:::

## Introduction

Schema Augmentations allow you to enhance your GraphQL schema documentation without modifying the source schema. This is perfect for "last mile" documentation improvements - flagging quirks, gotchas, usage examples, deprecation notices, or any additional context that helps developers understand your API better.

This is especially useful when you don't control the source schema (e.g., platform team owned, third-party APIs) or when you want to make temporary documentation improvements that can be enjoyed immediately while working to get those improvements into the original schema source.

## Supplying Your Augmentations

You can provide schema augmentations to Polen in various ways.

### Configuration

Define augmentations in your `polen.config.ts` file using the `schema.augmentations` array. Each augmentation can specify:

- **`on`** - [GraphQL path](/guides/features/graphql-schema-paths) to the type or field (e.g., `'Pokemon'` or `'Query.users'`)
- **`placement`** - How to apply the content (`'over'`, `'before'`, or `'after'`)
- **`content`** - Markdown content to add
- **`versions`** - Optional version-specific overrides

::: tip
The augmentation configuration has comprehensive JSDoc documentation with TypeScript intellisense. Hover over the configuration properties in your IDE to see detailed descriptions, examples, and usage notes.
:::

**Example:**

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    augmentations: [
      {
        on: 'User',
        placement: 'after',
        content: 'Additional context about the User type.',
      },
      // ... more augmentations
    ],
  },
})
```

### Future

::: info Future Support
Additional methods for supplying augmentations (such as separate files or external sources) may be supported in future releases.
:::

## Description Augmentations

You can augment descriptions for both **types** and **fields** in your schema. Polen supports full Markdown syntax in augmentations, which is automatically rendered in the documentation.

::: code-group

```ts [Type]
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    augmentations: [
      // Replace a type's description
      {
        on: 'User',
        placement: 'over',
        content:
          'Represents a user in the system. See the [User API Guide](/guides/users) for detailed usage.',
      },
      // Add a deprecation notice before existing description
      {
        on: 'LegacyAuth',
        placement: 'before',
        content:
          '⚠️ **Deprecated**: Use the new Auth type instead. This will be removed in v3.0.\n\n',
      },
    ],
  },
})
```

````ts [Field]
export default Polen.defineConfig({
  schema: {
    augmentations: [
      // Add usage example after a field's description
      {
        on: 'Query.users',
        placement: 'after',
        content:
          '\n\n**Example:**\n```graphql\nquery GetActiveUsers {\n  users(filter: { status: ACTIVE }) {\n    id\n    name\n    email\n  }\n}\n```',
      },
      // Add implementation note to a mutation field
      {
        on: 'Mutation.createUser',
        placement: 'after',
        content:
          '\n\n**Note:** This mutation requires authentication. Include your API key in the `Authorization` header.',
      },
    ],
  },
})
````

:::

## Use Cases

#### Platform Team Owned Schemas

When your organization's platform team owns the GraphQL schema, you can add domain-specific documentation without needing to modify the upstream schema or go through their approval process.

#### Third-Party APIs

Document external GraphQL APIs with additional context, implementation notes, or usage examples that the API provider doesn't include.

#### Temporary Documentation Improvements

Add documentation improvements immediately while working to get those changes incorporated upstream. You can remove the augmentations once the upstream changes are deployed.

#### Legacy Schema Documentation

Enhance documentation for older schemas that may lack comprehensive descriptions, without requiring schema changes that could impact existing clients.

#### Team-Specific Context

Add team-specific implementation details, internal usage patterns, or organizational context that wouldn't be appropriate in the source schema.

## Common Examples

### Adding API Reference Links

```ts
{
  on: 'Payment',
  placement: 'after',
  content: '\n\nSee also: [Payment Processing Guide](/guides/payments) | [Stripe Integration](/integrations/stripe)',
}
```

### Documenting Rate Limits

```ts
{
  on: 'Query.searchUsers',
  placement: 'after',
  content: '\n\n**Rate Limit:** 100 requests per minute',
}
```

### Adding Migration Notices

```ts
{
  on: 'User.fullName',
  placement: 'before',
  content: '**Migration Notice**: As of v2.5, use `firstName` and `lastName` separately.\n\n',
}
```

### Version-Specific Augmentations

```ts
{
  // Default for all versions
  on: 'Pokemon',
  placement: 'after',
  content: 'Standard Pokemon type.',
  
  // Version-specific overrides
  versions: {
    '2': {
      content: 'Enhanced Pokemon with battle capabilities.',
    },
    '3': {
      on: 'BattlePokemon',  // Type renamed in v3
      content: 'Battle-ready Pokemon with advanced stats.',
    },
  },
}
```

## Error Handling

Polen provides robust error handling for schema augmentations. If an augmentation references a non-existent type or field, or has invalid configuration, Polen will:

1. **Generate diagnostic errors** during the build process
2. **Continue building** without the invalid augmentation
3. **Report detailed error messages** showing exactly what went wrong

This ensures your build won't crash due to augmentation issues, while still alerting you to problems that need fixing.

**Example diagnostic output:**

```
[polen:schema-augmentations] Invalid path: Type 'NonExistentType' not found in schema (version: 2)
```

## Versioning Support

Schema augmentations fully support versioned schemas. You can:

- Apply augmentations to all versions (unversioned)
- Target specific versions with overrides
- Use different paths for types that change between versions

The version-specific configuration inherits from top-level defaults, allowing you to define common settings once and override only what changes per version.

## Limitations

### Type Safety

Currently, schema augmentations are not type-safe at the TypeScript level. You must manually ensure that the types and fields you're targeting actually exist in your schema. However, Polen will validate these at build time and generate helpful diagnostics for any issues.

**Future Enhancement**: Polen will generate static types for your augmentations to provide complete type safety and autocomplete support, making it impossible to target non-existent schema elements.
