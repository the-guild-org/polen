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

Define augmentations in your `polen.config.ts` file using the `schema.augmentations` array. Each augmentation specifies:

- **`type`** - What to augment (e.g., `'description'`)
- **`on`** - Where to target it (type name, field name, etc.)
- **`placement`** - How to place the content
  - **`over`** - Replace the existing description entirely
  - **`before`** - Prepend content to the existing description
  - **`after`** - Append content to the existing description
- **`content`** - What content to add

The JSDoc documentation provides extensive details on all available options.

**Example:**

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    augmentations: [
      {
        type: 'description',
        on: {
          type: 'TargetType',
          name: 'User',
        },
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
        type: `description`,
        on: {
          type: `TargetType`,
          name: `User`,
        },
        placement: `over`,
        content:
          `Represents a user in the system. See the [User API Guide](/guides/users) for detailed usage.`,
      },
      // Add a deprecation notice before existing description
      {
        type: `description`,
        on: {
          type: `TargetType`,
          name: `LegacyAuth`,
        },
        placement: `before`,
        content:
          `⚠️ **Deprecated**: Use the new Auth type instead. This will be removed in v3.0.\n\n`,
      },
    ],
  },
})
```

```ts [Field]
export default Polen.defineConfig({
  schemaAugmentations: [
    // Add usage example after a field's description
    {
      type: `description`,
      on: {
        type: `TargetField`,
        targetType: `Query`,
        name: `users`,
      },
      placement: `after`,
      content:
        `\n\n**Example:**\n\`\`\`graphql\nquery GetActiveUsers {\n  users(filter: { status: ACTIVE }) {\n    id\n    name\n    email\n  }\n}\n\`\`\``,
    },
    // Add implementation note to a mutation field
    {
      type: `description`,
      on: {
        type: `TargetField`,
        targetType: `Mutation`,
        name: `createUser`,
      },
      placement: `after`,
      content:
        `\n\n**Note:** This mutation requires authentication. Include your API key in the \`Authorization\` header.`,
    },
  ],
})
```

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
  type: `description`,
  on: {
    type: `TargetType`,
    name: `Payment`,
  },
  placement: `after`,
  content: `\n\nSee also: [Payment Processing Guide](/guides/payments) | [Stripe Integration](/integrations/stripe)`,
}
```

### Documenting Rate Limits

```ts
{
  type: `description`,
  on: {
    type: `TargetField`,
    targetType: `Query`,
    name: `searchUsers`,
  },
  placement: `after`,
  content: `\n\n**Rate Limit:** 100 requests per minute`,
}
```

### Adding Migration Notices

```ts
{
  type: `description`,
  on: {
    type: `TargetField`,
    targetType: `User`,
    name: `fullName`,
  },
  placement: `before`,
  content: `**Migration Notice**: As of v2.5, use \`firstName\` and \`lastName\` separately.\n\n`,
}
```

## Limitations

### Type Safety

Currently, schema augmentations are not type-safe. You must manually ensure that the types and fields you're targeting actually exist in your schema. Referencing non-existent types or fields will not produce TypeScript errors at build time.

**Future Enhancement**: Polen will generate static types for your augmentations to provide complete type safety and autocomplete support, making it impossible to target non-existent schema elements.
