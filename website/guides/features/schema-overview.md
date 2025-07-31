# Schema Overview

## Introduction

Polen provides comprehensive schema documentation features. You can work with a single schema or a set of them to capture different versions of your schema across time.

Features that Polen offers based on the schemas you give include automatic [reference docs](/guides/features/schema-reference) and [changelogs](/guides/features/schema-changelog).

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

You can use [configuration](/guides/features/configuration) if you wish, supplying a schema inline even. Refer to extensive JSDoc on configuration properties for details.

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useSources: 'memory',
    sources: {
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

### Introspection File Convention

If you have a `schema.introspection.json` file in your project root, Polen will automatically use it as a schema source. This file should contain a standard GraphQL introspection query result.

**This enables interoperability**: Any tool that produces a valid GraphQL introspection JSON file will work with Polen:

- GraphQL Codegen
- Apollo CLI
- Custom scripts
- CI/CD pipelines

```
schema.introspection.json  # Polen automatically detects this
```

You can also configure this explicitly:

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    sources: {
      introspectionFile: {
        path: './custom-introspection.json', // Custom path if needed
      },
    },
  },
})
```

#### Automatic Introspection

Polen can also fetch and cache introspection results for you if you configure it. For example:

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    sources: {
      introspection: {
        url: 'https://api.example.com/graphql',
        headers: {
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
        },
      },
    },
  },
})
```

##### Lifecycle Details

- If there is a `schema.introspection.json` file then Polen will not run introspection.
- If there is no file present then Polen will perform introspection and create `schema.introspection.json`
- So, delete this file to have new introspection.
- **Note**: When running the dev server, Polen watches for changes to `schema.introspection.json`. If you delete the file, Polen will automatically fetch a fresh schema from your endpoint.

##### Query details

- Polen uses Graffle's introspection extension which performs the [standard GraphQL introspection query](https://spec.graphql.org/draft/#sec-Introspection)
- Fetches complete schema information: all types, fields, descriptions, deprecations, directives, etc.
- Currently no configuration options for customizing the introspection query
- The `schema.introspection.json` file contains the raw introspection query result in standard GraphQL format
- The file format is validated when read - invalid JSON or introspection data will produce clear error messages

### Versioned Directory Structure

The versioned directory source organizes schemas into separate subdirectories for clear version boundaries. This is ideal for APIs with distinct major versions rather than just evolutionary revisions.

```ts
import { polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    sources: {
      versionedDirectory: {
        path: './schema', // Directory containing version subdirectories
      },
    },
  },
})
```

#### Directory Structure Examples

**Semantic Versioning:**

```
schema/
  1.0.0/
    schema.graphql
  1.1.0/
    schema.graphql  
  2.0.0/
    schema.graphql
```

**Date-based Versioning:**

```
schema/
  2024-01-15/
    schema.graphql
  2024-03-20/
    schema.graphql
  2024-06-10/
    schema.graphql
```

**Custom Versioning:**

```
schema/
  v1/
    schema.graphql
  v2-beta/
    schema.graphql
  production/
    schema.graphql
```

### Precedence

When multiple schema sources are available, Polen uses the following precedence order:

1. **versionedDirectory** - Versioned schemas from subdirectories (default: `./schema/`)
2. **directory** - Multiple SDL files from a directory (default: `./schema/`)
3. **file** - Single SDL file (default: `./schema.graphql`)
4. **memory** - Schemas defined in configuration
5. **introspection** - GraphQL endpoint introspection
6. **introspectionFile** - Pre-existing introspection JSON file

You can override this default order using the `useSources` configuration:

```ts
schema: {
  // Try introspection first, fall back to file
  useSources: ['introspection', 'file'],
  sources: {
    introspection: { url: 'https://api.example.com/graphql' },
    file: { path: './fallback-schema.graphql' }
  }
}
```

## Versioning

Polen supports documenting different versions of your schema.

### Versions vs Revisions

Polen distinguishes between two related but different concepts:

- **Version**: An identifier for a different version of your API (e.g., `1.0.0`, `2.0.0`, `v1`, `v2`). Each version represents a distinct API version that may have:
  - Breaking changes or new features
  - Different endpoints
  - Different authentication/headers
  - Completely different schemas
- **Revision**: A point-in-time change within a version's evolution, tracking incremental changes and their dates as the schema evolves over time.

Each version can have multiple revisions as your schema evolves. This enables Polen to generate detailed changelogs showing what changed between versions and when those changes occurred.

### Version Formats

Each schema needs a version identifier, just like package releases on npm. Polen supports multiple version formats to accommodate various versioning strategies.

**Important**: All schemas in your project must use the same version format.

#### Semantic Versioning (Semver)

Polen supports semantic versioning following the [SemVer specification](https://semver.org/):

- **Format**: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`, `2.1.3`, `3.0.0-beta.1`)
- **Examples**: `1.0.0`, `2.1.0`, `3.0.0-alpha.1`
- **Behavior**: Natural semantic version ordering (1.0.0 < 1.1.0 < 2.0.0)

#### Date

Polen supports date-based versions in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format:

- **Format**: `YYYY-MM-DD`
- **Examples**: `2024-01-15`, `2023-12-31`, `2024-03-20`
- **Behavior**: Chronological ordering by date

#### Custom Strings

Polen also supports arbitrary string versions for custom versioning schemes:

- **Format**: Any string
- **Examples**: `v1`, `beta`, `production`, `winter-2024`
- **Behavior**: Alphabetical string ordering

### Supplying Your Versioned Schema

Here's how supplying multiple schemas maps to the different sources:

| Source Type                            | How Multiple Schemas Are Provided                                                                      | Examples                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **[File](#file-convention)**           | N/A (single schema only)                                                                               | N/A                                                                                           |
| **[Directory](#directory-convention)** | Place multiple SDL files in `schema/` directory with each [version](#version-formats) as the file name | <pre>schema/<br>├── 2024-01-15.graphql<br>└── 2024-03-20.graphql</pre>                        |
| **Versioned Directory**                | Create subdirectories for each version, each containing a `schema.graphql` file                        | <pre>schema/<br>├── 1.0.0/<br>│ └── schema.graphql<br>└── 2.0.0/<br> └── schema.graphql</pre> |
| **[Configuration](#configuration)**    | Define multiple versions in `sources.memory.versions` array                                            | [See example above](#configuration)                                                           |
| **Introspection File**                 | N/A (single schema only)                                                                               | N/A                                                                                           |
| **Automatic Introspection**            | N/A (single schema only)                                                                               | N/A                                                                                           |

## Features Enabled

Polen provides the following schema-related features:

| Feature                                            | Single Schema                      | Multiple Schemas                                           |
| -------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| **[Reference](/guides/features/schema-reference)** | Basic type and field documentation | Versioned URLs for historical schema access                |
| **[Changelog](/guides/features/schema-changelog)** | N/A                                | Automatically generated changelog showing schema evolution |

## Current Limitations

- Introspection only supports single schemas (no versioning/changelog support)
- Version navigation in the reference docs requires manual URL construction
- Changelog doesn't include clickable links to versioned reference pages

```
```
