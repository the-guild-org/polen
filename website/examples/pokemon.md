# Pokemon Example

Explore Polen's powerful changelog feature with a fun Pokemon GraphQL API that evolves over time.

[**View Live Example →**](https://polen.js.org/examples-live/pokemon/)

## Features Showcased

This example highlights:

- **Schema Changelog**: Multiple versions showing API evolution with integer-based versioning
- **Change Criticality**: Breaking, dangerous, and safe changes clearly grouped
- **All Change Types**: Demonstrates comprehensive GraphQL schema changes
- **Interactive Navigation**: Easy browsing between releases via sidebar and version picker
- **Version Comparison**: See exactly what changed between any two versions
- **Versioned Directory Structure**: Clean organization with separate directories per version

## Run Locally

```bash
git clone https://github.com/the-guild-org/polen.git
cd polen
pnpm install

# Run the Pokemon example
cd examples/pokemon
pnpm dev
```

## Key Files

- `polen.config.ts` - Configuration using versioned directory source
- `schema/` - Directory containing version subdirectories
- `schema/1/` - Initial Pokemon API schema (version 1)
- `schema/2>1@2024-02-20/` - Expanded schema with new types (version 2, branched from 1)
- `schema/3>2@2024-05-10/` - Latest evolution with comprehensive Pokemon data (version 3, branched from 2)

## Source Code

Check out the [source code on GitHub](https://github.com/the-guild-org/polen/tree/main/examples/pokemon) to learn how the changelog is configured.
