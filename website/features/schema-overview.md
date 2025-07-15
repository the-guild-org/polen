# Schema Overview

## Introduction

Polen provides comprehensive schema documentation features. You can work with a single schema or a set of them to capture different versions of your schema across time.

Features that Polen offers based on the schemas you give include automatic [reference docs](/features/schema-reference) and [changelogs](/features/schema-changelog).

## Supplying Your Schema

You can provide your GraphQL schema to Polen in various ways ranging from convention to configuraiton.

### File Convention

You can have a single `schema.graphql` SDL file in your project directory. This works for simple projects but won't support versioning.

```
schema.graphql
```

### Directory Convention

You can have your schema under a `schema` directory in your project root. This opens you up to versioning (discussed later).

```
schema/
  schema.graphql
```

### Configuration

You can use [configuration](/features/configuration) if you wish, supplying a schema inline even. Refer to extensive JSDoc on configuration properties for details.

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
        ],
      },
    },
  },
})
```

### Precedence

When multiple schema sources are available, Polen uses the following precedence order:

1. **Configuration** - If you specify `schema` in your `polen.config.ts`, it takes precedence over any file-based detection
2. **Directory Convention** - If no configuration is provided, Polen looks for a `schema/` directory first
3. **File Convention** - If no directory is found, Polen falls back to looking for a single `schema.graphql` file

This means configuration always overrides convention-based detection, allowing you to explicitly control which schema source to use regardless of what files exist in your project.

## Versioning

Polen supports documenting different versions of your schema.

### Specifier Kinds

Each schema needs a version identifier, just like package releases on npm. Polen supports different specifier kinds to accommodate various versioning strategies.

**Important**: All schemas in your project must use the same specifier kind.

#### Date

Polen supports date-based versions in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format:

- **Format**: `YYYY-MM-DD`
- **Examples**: `2024-01-15`, `2023-12-31`, `2024-03-20`
- **Behavior**: Shows the schema version from that specific date

#### Future

::: info Future Support
Additional version formats like semantic versioning (semver) may be supported in future releases. [Share your feedback](https://github.com/the-guild-org/polen/issues/123) on what version formats would be most valuable for your use case.
:::

### Supplying Your Versioned Schema

Here's how supplying multiple schemas maps to the different sources:

| Source Type                            | How Multiple Schemas Are Provided                                                                      | Examples                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **[File](#file-convention)**           | N/A (single schema only)                                                                               | N/A                                                                    |
| **[Directory](#directory-convention)** | Place multiple SDL files in `schema/` directory with each [version](#specifier-kinds) as the file name | <pre>schema/<br>├── 2024-01-15.graphql<br>└── 2024-03-20.graphql</pre> |
| **[Configuration](#configuration)**    | Define multiple versions in `dataSources.memory.versions` array                                        | [See example above](#configuration)                                    |

## Features Enabled

Polen provides the following schema-related features:

| Feature                                     | Single Schema                      | Multiple Schemas                                           |
| ------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| **[Reference](/features/schema-reference)** | Basic type and field documentation | Versioned URLs for historical schema access                |
| **[Changelog](/features/schema-changelog)** | N/A                                | Automatically generated changelog showing schema evolution |

## Current Limitations

- Only works with SDL-based schemas (file, directory, or memory with SDL strings)
- Introspection is only available through `polen open` for instant exploration, not for building your own Polen site ([enhancement request](https://github.com/the-guild-org/polen/issues/124))
- Version navigation in the reference docs requires manual URL construction
- Changelog doesn't include clickable links to versioned reference pages
