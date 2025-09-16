# GraphQL Schema Paths

GraphQL Schema Paths provide a way to reference specific elements within your GraphQL schema. Polen uses this syntax for targeting types and fields in features like schema augmentations and markdown references.

## Introduction

GraphQL Schema Paths allow you to reference types and fields in your schema hierarchy. This enables features like [schema augmentations](/guides/features/schema-augmentations) and interactive documentation links.

## Path Syntax

### Types

Reference a GraphQL type directly:

```
User
Post
Query
```

### Fields

Reference a field on a type using dot notation:

```
User.email
Query.users
Mutation.createPost
```

### Arguments

Reference a field argument using the `$` prefix:

```
Query.user$id
Query.users$filter
Mutation.createPost$input
```

### Resolved Types

Reference the return type of a field using the `#` suffix:

```
Query.users#         // Resolves to User (from [User!]!)
User.posts#          // Resolves to Post (from [Post!])
Mutation.createPost# // Resolves to the Post type
```

## Usage in Polen

### Schema Augmentations

Use paths to target specific schema elements for documentation enhancement:

```ts
export default Polen.defineConfig({
  schema: {
    augmentations: [
      {
        on: 'User', // Target a type
        placement: 'after',
        content: 'Additional information about users',
      },
      {
        on: 'Query.users', // Target a field
        placement: 'before',
        content: 'This query supports pagination',
      },
      {
        on: 'Query.users$filter', // Target an argument
        placement: 'after',
        content:
          'See the [filtering guide](/guides/filtering) for available options',
      },
    ],
  },
})
```

### Markdown References

Create interactive links to schema elements in your markdown documentation using the `gql:` prefix:

```markdown
The `gql:User` type represents a system user.

To fetch users, use the `gql:Query.users` field with an optional
`gql:Query.users$filter` argument.

The mutation `gql:Mutation.createPost$input` accepts user input and
returns a `gql:Mutation.createPost#` type.
```

These references are automatically converted to interactive links that navigate to the corresponding schema documentation.

## Path Resolution

Polen validates paths at build time to ensure they reference valid schema elements. If a path cannot be resolved, you'll receive a helpful diagnostic message indicating the issue.

### Versioned Schemas

For versioned schemas, paths are resolved against each version. Polen will:

1. Check the latest version first
2. Fall back to earlier versions if needed
3. Report which version contains the referenced element

## Examples

### Type References

```
User                 // The User type
Post                 // The Post type
Query                // The Query root type
```

### Field References

```
User.email           // Email field on User
Query.users          // Users query field
Mutation.createPost  // Create post mutation
```

### Argument References

```
Query.users$filter   // Filter argument on users query
Query.user$id        // ID argument on user query
Mutation.createPost$input  // Input argument on createPost
```

### Resolved Type References

```
Query.users#         // Return type of users query
User.posts#          // Return type of posts field
```

## Error Messages

When Polen encounters an invalid path, it provides diagnostic warnings during build:

```
Cannot resolve GraphQL path: User.invalidField
```

This helps you identify and fix path issues during development.

## Best Practices

1. **Start Simple**: Begin with type and field references before using advanced syntax
2. **Validate Early**: Run build checks to catch invalid paths
3. **Use Consistent Naming**: Follow your schema's naming conventions in paths

## Related Features

- [Schema Augmentations](/guides/features/schema-augmentations) - Enhance documentation using paths
- [Schema Overview](/guides/features/schema-overview) - Understanding schema structure
