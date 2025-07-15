# Schema Overview

Polen provides comprehensive schema documentation features. You can work with a single schema or a set of them to capture different versions of your schema across time.

Features that Polen offers based on the schemas you give include automatic [reference docs](/features/schema-reference) and [changelogs](/features/schema-changelog).

## Sources

You can provide your GraphQL schema to Polen in various ways:

### Single Schema File

Have a single `schema.graphql` SDL file in your project directory:

```
schema.graphql
```

This is the simplest approach for basic schema reference documentation.

### Directory Source

For advanced features like changelogs and version-specific reference documentation, you can configure multiple schema versions.

Place multiple SDL files in a `schema` directory, using the date prefix pattern `YYYY-MM-DD.graphql`:

```
schema/
  2023-01-15.graphql
  2023-06-20.graphql
  2024-03-10.graphql
```

The dates in the filenames determine the chronological order of versions.

### Memory Source

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

## Versioning

## Formats

Currently, Polen supports date-based versions in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format:

- **Format**: `YYYY-MM-DD`
- **Examples**: `2024-01-15`, `2023-12-31`, `2024-03-20`
- **Behavior**: Shows the schema version from that specific date

::: info Future Support
Additional version formats like semantic versioning (semver) may be supported in future releases. [Share your feedback](https://github.com/the-guild-org/polen/issues/123) on what version formats would be most valuable for your use case.
:::

## Tags

Polen provides a convenience tag for accessing the most recent version:

- **`latest`**: Always points to the most recent schema version
- **Usage**: Default version when no version is specified

## Sources

A schema can supply its version through different means.

### Directory Source

When using the directory approach, the version string comes from the filename:

```
schema/
  2023-01-15.graphql  → version: "2023-01-15"
  2024-03-20.graphql  → version: "2024-03-20"
  2024-06-10.graphql  → version: "2024-06-10" (also accessible as "latest")
```

### Memory Source

When using the memory approach, the version string is derived from the `date` field:

```ts
// polen.config.ts
export default Polen.defineConfig({
  schema: {
    useDataSources: 'memory',
    dataSources: {
      memory: {
        versions: [
          {
            date: new Date('2023-01-15'), // → version: "2023-01-15"
            value: `type Query { hello: String }`,
          },
          {
            date: new Date('2024-03-20'), // → version: "2024-03-20"
            value: `type Query { hello: String, users: [User] }`,
          },
          {
            date: new Date('2024-06-10'), // → version: "2024-06-10" (also "latest")
            value:
              `type Query { hello: String, users: [User] } type User { id: ID! }`,
          },
        ],
      },
    },
  },
})
```

The most recent version (newest date) is always accessible via both its date string and the `latest` keyword.

## Features Enabled

When you configure multiple schema versions, the following features become available:

### Schema Reference Versioning

- View any version of your schema through versioned URLs
- Access specific types and fields from historical versions
- Compare how your schema has evolved over time

Learn more: [Schema Reference](/features/schema-reference)

### Schema Changelog

- Automatically generated changelog showing differences between versions
- Organized by change type and criticality level
- Chronological view of your schema's evolution

Learn more: [Schema Changelog](/features/schema-changelog)

## Current Limitations

- Only works with SDL-based schemas (file, directory, or memory with SDL strings)
- Does not support schemas provided via introspection or other non-SDL sources
- Version navigation in the reference docs requires manual URL construction
- Changelog doesn't include clickable links to versioned reference pages
