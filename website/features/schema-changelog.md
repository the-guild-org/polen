# Schema Changelog

Polen can render a changelog for your GraphQL schema, showing how it has evolved over time.

## Overview

This feature is automatically enabled when you provide multiple versions of your schema.

When active, a "Changelog" link appears in the navigation bar.

The overall process performed by Polen is something like this:

1. Polen reads a set of schemas (see below)
2. Orders them by date
3. Detects differences (changes) between each sequential pair (powered by GraphQL Inspector)
4. Displays in chronological order (newest at page top) one section per schema, each section displaying how it changed

## Input

### Directory

Place multiple SDL files in a `schema` directory, using the date prefix pattern `YYYY-MM-DD.graphql`:

```
schema/
  2023-01-15.graphql
  2023-06-20.graphql
  2024-03-10.graphql
```

The dates in the filenames determine the chronological order of versions.

### Memory

Configure multiple schema versions in your `polen.config.ts`:

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useDataSources: 'memory',
    dataSources: {
      memory: {
        versions: [
          {
            date: new Date('2023-01-15'),
            value: `
              type Query {
                users: [User]
              }
              type User {
                id: ID!
                name: String!
              }
            `,
          },
          {
            date: new Date('2023-06-20'),
            value: `
              type Query {
                users: [User]
                user(id: ID!): User
              }
              type User {
                id: ID!
                name: String!
                email: String!
              }
            `,
          },
        ],
      },
    },
  },
})
```

## Change Types

Polen's changelog feature is currently in early development. Only the following changes are displayed:

### Types

- **Added** - A new type is added to the schema

### Fields

- **Added** - A new field is added to a type

### Coming Soon

There are many more changes detected by the underlying GraphQL Inspector library but not yet displayed by Polen. [Please upvote this issue to prioritize it.](https://github.com/the-guild-org/polen/issues/111)

::: details View

###### Types

- **Removed** - A type is removed from the schema
- **Kind changed** - A type changes kind (e.g., from object to interface)
- **Description added/removed/changed** - Type description modifications

###### Fields

- **Removed** - A field is removed from a type
- **Type changed** - A field's type is modified
- **Deprecation added** - A field is marked as deprecated
- **Deprecation removed** - A field's deprecation is removed
- **Description added/removed/changed** - Field description modifications

##### Arguments

- **Added** - A new argument is added to a field
- **Removed** - An argument is removed from a field
- **Type changed** - An argument's type is modified
- **Default value changed** - An argument's default value is modified
- **Description changed** - Argument description modifications

##### Directives

- **Added/Removed** - Directives added or removed from the schema
- **Location added/removed** - Valid locations for a directive change
- **Argument added/removed** - Directive arguments change
- **Usage changes** - Where directives are used in the schema

##### Enum Values

- **Added/Removed** - Enum values added or removed
- **Deprecation changes** - Enum value deprecation status changes
- **Description changes** - Enum value description modifications

##### Other Changes

- **Union member added/removed** - Types added/removed from unions
- **Interface implementations** - Objects implementing/removing interfaces
- **Input field changes** - Input object field modifications
- **Schema root type changes** - Query/Mutation/Subscription type changes

:::

## Notes

### Effect on Reference Documentation

When multiple schema versions exist, the reference documentation always shows the **latest version**. There is currently no version selector to view older schema versions in the reference docs.

### Navigation

- The changelog page is accessible at `/changelog`
- A "Changelog" link appears in the navigation bar when you have 2 or more schema versions

### Current Limitations

- Only works with SDL-based schemas (file, directory, or memory with SDL strings)
- Does not support schemas provided via introspection or other non-SDL sources
- Does not have a version selector for the reference documentation
- Shows all changes in a single chronological view without filtering options
- Limited change type display (see "Kinds of Changes Currently Displayed" above)
