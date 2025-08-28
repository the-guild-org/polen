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
import { buildSchema } from 'graphql'
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useSources: ['memory'],
    sources: {
      memory: {
        versions: [
          {
            schema: buildSchema(`
              type Query {
                users: [User]
              }
              type User {
                id: ID!
                name: String!
              }
            `),
            date: '2023-01-15',
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
    useSources: ['introspectionFile'],
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
    useSources: ['introspection'],
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

The versioned directory source organizes schemas into version directories with support for both versions and revisions within each version. This provides Git-like semantics where versions are like branches and revisions are like commits.

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useSources: ['versionedDirectory'],
    sources: {
      versionedDirectory: {
        path: './schema', // Directory containing version subdirectories
      },
    },
  },
})
```

#### Directory Structure Examples

**Simple Versions (No Revisions):**

```
schema/
  1.0.0/
    schema.graphql      # Single schema file per version
  2.0.0/
    schema.graphql
```

**Versions with Revisions:**

```
schema/
  1.0.0/
    2024-01-15.graphql  # Initial release
    2024-02-20.graphql  # Added evolution queries
    2024-03-15.graphql  # Added battle system
  2.0.0/
    2024-04-01.graphql  # Major redesign
    2024-05-10.graphql  # Added features
```

**Versions with Branch Points:**

Directory names can encode where a version branched from using the format: `<version>[><parent-version>[@<branch-date>]]`

```
schema/
  1.0.0/                          # Root version
    2024-01-15.graphql
    2024-02-20.graphql
    2024-03-15.graphql
    
  2.0.0>1.0.0@2024-02-20/        # Branched from 1.0.0 at revision 2024-02-20
    2024-04-01.graphql
    2024-05-10.graphql
    
  2.1.0>2.0.0/                   # Branched from 2.0.0 (no specific revision)
    2024-06-01.graphql
```

Branch point syntax:

- `2.0.0>1.0.0@2024-02-20` - Version 2.0.0 branched from 1.0.0's revision on 2024-02-20
- `2.0.0>1.0.0` - Version 2.0.0 branched from 1.0.0's initial state (no revisions)
- `2.0.0` - Version 2.0.0 has no parent (root version)

#### How It Works

1. **Version Detection**: Directories are parsed to extract version number and optional branch information
2. **Revision Loading**: Within each version directory, Polen looks for:
   - Date-named files (`YYYY-MM-DD.graphql`) for revisions
   - Fallback to `schema.graphql` if no revision files exist
3. **Change Calculation**: Changes are calculated between adjacent revisions within the same version
4. **Branch Tracking**: Parent versions and specific revision branch points are preserved for accurate history

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

- **Version**: An identifier for a different version of your API (e.g., `1.0.0`, `2.0.0`, `v1`, `v2`). Think of versions like Git branches - they represent major API versions that may diverge and evolve independently. Each version:
  - Has its own evolution timeline
  - Can branch from a specific point in another version's history
  - May contain breaking changes from its parent
  - Represents a distinct API contract

- **Revision**: A point-in-time change within a version's evolution. Think of revisions like Git commits - they capture the incremental changes made to a version over time. Each revision:
  - Has a date (when the change was made)
  - Contains a set of changes from the previous revision
  - Helps track the evolution within a single version
  - Enables detailed changelogs

#### Example: Version and Revision Timeline

```
Version 1.0.0:
  2024-01-15 (revision) - Initial schema
  2024-02-20 (revision) - Added evolution queries
  2024-03-15 (revision) - Added battle system
    ┃
    ┗━━> Version 2.0.0 branches here
         2024-04-01 (revision) - Major redesign
         2024-05-10 (revision) - Added regional variants
           ┃
           ┗━━> Version 3.0.0 branches here
                2024-06-01 (revision) - GraphQL Federation
```

This Git-like model enables:

- **Version branching**: New versions can branch from any revision of a parent version
- **Revision tracking**: Each version maintains its own revision history
- **Change calculation**: Changes are computed between adjacent revisions
- **Branch point preservation**: Polen knows exactly where versions diverged

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

| Source Type                            | How Multiple Schemas Are Provided                                                                       | Examples                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[File](#file-convention)**           | N/A (single schema only)                                                                                | N/A                                                                                                                                                |
| **[Directory](#directory-convention)** | Place multiple SDL files in `schema/` directory with each [revision](#version-formats) as the file name | <pre>schema/<br>├── 2024-01-15.graphql<br>└── 2024-03-20.graphql</pre>                                                                             |
| **Versioned Directory**                | Create version subdirectories with revision files inside, optionally with branch point syntax           | <pre>schema/<br>├── 1.0.0/<br>│ ├── 2024-01-15.graphql<br>│ └── 2024-02-20.graphql<br>└── 2.0.0>1.0.0@2024-02-20/<br> └── 2024-04-01.graphql</pre> |
| **[Configuration](#configuration)**    | Define multiple versions in `sources.memory.versions` array                                             | [See example above](#configuration)                                                                                                                |
| **Introspection File**                 | N/A (single schema only)                                                                                | N/A                                                                                                                                                |
| **Automatic Introspection**            | N/A (single schema only)                                                                                | N/A                                                                                                                                                |

## Features Enabled

Polen provides the following schema-related features:

| Feature                                            | Single Schema                      | Multiple Schemas                                           |
| -------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| **[Reference](/guides/features/schema-reference)** | Basic type and field documentation | Versioned URLs for historical schema access                |
| **[Changelog](/guides/features/schema-changelog)** | N/A                                | Automatically generated changelog showing schema evolution |

## Current Limitations

- Introspection only supports single schemas (no versioning/changelog support)
- Changelog doesn't include clickable links to versioned reference pages

```
```
