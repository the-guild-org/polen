# Schema Reference

Polen can derive schema reference documentation from your GraphQL Schema.

## Configuration

For schema configuration options including single files, multiple versions, and memory-based schemas, see [Schema Overview](/features/schema-overview).

## URL Structure

The reference documentation is accessible through these URL patterns:

### Basic Structure

- Type overview: `/reference/{type}`
- Field details: `/reference/{type}/{field}`

### Examples

```
# View the User type
/reference/User

# View the email field on the User type
/reference/User/email

# View the Query type
/reference/Query
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

## Versioning

When you have multiple schema versions configured, Polen enables version-specific reference documentation. This allows you to view your GraphQL schema as it existed at any point in time.

For complete details on schema versioning including configuration and version formats, see [Schema Overview](/features/schema-overview).

### Versioned URLs

The [basic URL structure](#url-structure) shown earlier always displays the latest version. When you have multiple schema versions, you can access specific versions using an extended URL pattern:

- Type overview: `/reference/version/{version}/{type}`
- Field details: `/reference/version/{version}/{type}/{field}`

Where `{version}` can be:

- A specific date: `2024-01-15`
- The `latest` tag: `latest`

### Examples

```
# These are equivalent - both show the latest version
/reference/User
/reference/version/latest/User

# View the User type as it existed on January 15, 2024
/reference/version/2024-01-15/User

# View a specific field from that version
/reference/version/2024-01-15/User/email
```

### Use Cases

The versioned reference feature is particularly useful for:

- **API Evolution Analysis**: Compare how types have changed over time
- **Client Compatibility**: Check what fields were available when clients were last updated
- **Deprecation Documentation**: Reference the exact state of deprecated fields before removal
- **Migration Planning**: Show exact differences between versions for planning migrations
