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

Polen displays all GraphQL schema changes detected by GraphQL Inspector, organized into logical groups:

### Type Changes

- **Operations** - Types added, removed, or changed in kind
- **Descriptions** - Type description modifications

### Field Changes

- **Operations** - Fields added, removed, or type changed
- **Descriptions** - Field description modifications
- **Deprecation** - Field deprecation status changes
- **Deprecation Reasons** - Field deprecation reason modifications

### Argument Changes

- **Operations** - Arguments added or removed
- **Modifications** - Default value or type changes
- **Descriptions** - Argument description changes

### Enum Changes

- **Value Operations** - Enum values added or removed
- **Value Descriptions** - Enum value description changes
- **Value Deprecation** - Enum value deprecation reason changes

### Input Type Changes

- **Field Operations** - Input fields added, removed, or type changed
- **Field Descriptions** - Input field description changes
- **Default Values** - Input field default value changes

### Schema Composition Changes

- **Union Members** - Types added/removed from unions
- **Interface Implementations** - Objects implementing/removing interfaces
- **Directive Operations** - Directives added or removed
- **Directive Locations** - Valid directive locations modified
- **Directive Arguments** - Directive argument changes
- **Directive Usage** - Where directives are applied in the schema
- **Schema Root Types** - Query/Mutation/Subscription type changes

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
