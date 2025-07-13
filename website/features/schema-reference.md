# Schema Reference

Polen can derive schema reference documentation from your GraphQL Schema.

## Input

You can provide your GraphQL schema to Polen in various ways.

### File

Have a single `schema.graphql` SDL file in your project directory. Example:

```
schema.graphql
```

### Directory

Have a `schema` directory in your project directory with multiple versions of your schema as SDL files named using format: `YYYY-MM-DD.graphql`. Example:

```
schema/
  2023-01-13.graphql
  2020-09-26.graphql
```

This approach allows Polen to render a changelog for your schema.

### Memory

You can provide a schema to Polen in memory via configuration.

You have control to provide one or multiple schemas, with or without dates.

If no dates are given then the current time is assumed.

If you provide multiple versions then Polen can render a changelog for you.

Basic example:

```ts
// polen.config.ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useDataSources: `memory`,
    dataSources: {
      memory: {
        versions: [
          {
            date: new Date('2023-01-13'),
            value: `type Query { hello: String }`,
          },
        ],
      },
    },
  },
})
```

## Schema Augmentations

Schema Augmentations allow you to enhance your GraphQL schema documentation without modifying the schema itself. This is perfect for adding implementation details, usage examples, deprecation notices, or any additional context that helps developers understand your API better.

### Description Augmentations

You can augment descriptions for both **types** and **fields** in your schema. Polen supports full Markdown syntax in augmentations, which is automatically rendered in the documentation.

#### Placement Options

- **`over`** - Replace the existing description entirely
- **`before`** - Prepend content to the existing description
- **`after`** - Append content to the existing description

#### Augmenting Type Descriptions

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schemaAugmentations: [
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
})
```

#### Augmenting Field Descriptions

```ts
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

### Common Use Cases

#### Adding API Reference Links

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

#### Documenting Rate Limits

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

#### Adding Migration Notices

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

### Best Practices

1. **Keep augmentations focused** - Add specific, actionable information
2. **Use Markdown effectively** - Format content for readability with headers, lists, and code blocks
3. **Maintain consistency** - Use similar patterns across your augmentations
4. **Version appropriately** - When schemas change, update augmentations accordingly
5. **Link to detailed docs** - Use augmentations to point to comprehensive guides rather than duplicating content
