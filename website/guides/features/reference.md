# Reference

## Introduction

Polen automatically generates reference documentation for your GraphQL schema. The reference section provides comprehensive type and field documentation, complete with interactive navigation and version support.

## Navigation

### Navbar

When a schema is supplied, the [navbar](/guides/features/navbar) displays a "Reference" link that takes users to your schema documentation.

### Routes

The reference documentation uses these URL patterns:

- `/reference/{type}` – View a specific type
- `/reference/{type}/{field}` – View a specific field on a type

#### Examples

```
/reference/User              # View the User type
/reference/User/email        # View the email field on User
/reference/Query             # View root Query type
/reference/Mutation/createPost  # View createPost mutation
```

## Features

### Sidebar Organization

The reference documentation sidebar automatically organizes your schema types into logical sections:

1. **Root Types** - Query, Mutation, and Subscription types appear first
2. **Custom Categories** - Your configured type groupings (see [Categories](#categories) below)
3. **Other Types** - All remaining types organized by kind (Objects, Interfaces, Enums, etc.)

### Categories

You can create custom sidebar groupings to organize related types together. This is especially useful for large schemas where you want to group types by domain or functionality.

#### Configuration

Configure categories in your Polen config:

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    categories: [
      {
        name: 'Errors',
        typeNames: [/.*Error$/], // Match all types ending with "Error"
      },
      {
        name: 'Authentication',
        typeNames: ['User', 'AuthToken', 'LoginInput'], // Exact type names
      },
      {
        name: 'Payment Types',
        typeNames: [/^Payment/, 'Invoice', 'Subscription'], // Mix patterns and exact names
      },
    ],
  },
})
```

#### Pattern Matching

Categories support flexible type matching:

- **Exact strings**: `'User'`, `'Product'` - matches specific type names
- **Regular expressions**: `/.*Error$/`, `/^Payment/` - matches patterns
- **Mixed**: Combine both in the same category

#### Exclude Mode

You can also use exclude mode to create categories from everything except certain types:

```ts
{
  name: 'Non-System Types',
  typeNames: [/__.*/, /.*Internal$/],  // Exclude introspection and internal types
  mode: 'exclude',
}
```

#### Versioned Categories

For versioned schemas, you can define different categories per version:

```ts
schema: {
  categories: {
    '2024-01-01': [
      { name: 'Legacy Errors', typeNames: [/.*Error$/] },
    ],
    '2024-06-01': [
      { name: 'Errors', typeNames: [/.*Error$/, /.*Exception$/] },
      { name: 'Events', typeNames: [/.*Event$/] },
    ],
  },
}
```

### Type Documentation

Each type page displays:

- Type description (from schema or augmentations)
- All fields with their types and descriptions
- Deprecation notices when applicable
- Implementation details (for interfaces)
- Union member types (for unions)

### Field Documentation

Field pages provide:

- Field type information
- Arguments (for fields that accept them)
- Detailed descriptions
- Deprecation status and migration guides
- Usage examples (via augmentations)

## Versioning

When you have [multiple schema versions](/guides/features/schema-overview#versioning) configured, Polen provides powerful version navigation features.

### Version Picker

An interactive dropdown appears when multiple versions exist, allowing users to:

- Switch between any schema version instantly
- Jump to the latest version
- See the currently selected version

The picker intelligently handles navigation:

- **Path preservation**: Attempts to navigate to the same type/field in the target version
- **Smart fallbacks**: When types don't exist in the target version, finds the closest equivalent
- **Helpful notifications**: Shows toasts explaining what changed between versions

### URL-based Navigation

You can also navigate directly to specific versions:

```
/reference/version/{version}/{type}
/reference/version/{version}/{type}/{field}
```

Where `{version}` can be:

- A specific date: `2024-01-15`
- The latest tag: `latest`

#### Examples

```
# View latest version (these are equivalent)
/reference/User
/reference/version/latest/User

# View historical version
/reference/version/2024-01-15/User
/reference/version/2024-01-15/User/email
```

## Enhancements

### Schema Augmentations

You can enhance the reference documentation without modifying your schema using [augmentations](/guides/features/schema-augmentations). This allows adding:

- Rich descriptions with markdown
- Usage examples
- Implementation notes
- Migration guides
- Related links

### Markdown Support

Descriptions support markdown formatting:

- **Bold** and _italic_ text
- `Code` snippets
- Lists and tables
- Links to other documentation

## Troubleshooting

### Version Picker Not Appearing

**Cause**: Only appears with 2+ schema versions
**Solution**: Ensure multiple versions are configured in your [schema sources](/guides/features/schema-overview#supplying-your-schema)

### Type Not Found Errors

**Cause**: Type doesn't exist in the selected version
**Solution**: Use the version picker to switch to a version containing the type

### Missing Descriptions

**Cause**: No description in schema or augmentations
**Solution**: Add descriptions via:

- GraphQL schema comments
- [Schema augmentations](/guides/features/schema-augmentations)

### Performance Issues

**Cause**: Very large schemas may load slowly
**Solution**: Polen uses efficient hydration, but initial load of massive schemas requires patience
