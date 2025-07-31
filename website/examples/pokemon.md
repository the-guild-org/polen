# Pokemon Example

Explore Polen's powerful changelog feature with a fun Pokemon GraphQL API that evolves over time.

[**View Live Example →**](https://polen.js.org/examples-live/pokemon/)

## Features Showcased

This example highlights:

- **Schema Changelog**: Multiple versions showing API evolution with semantic versioning
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
- `schema/1.0.0/schema.graphql` - Initial Pokemon API schema
- `schema/2.0.0/schema.graphql` - Expanded schema with new types
- `schema/3.0.0/schema.graphql` - Latest evolution with comprehensive Pokemon data

## Source Code

Check out the [source code on GitHub](https://github.com/the-guild-org/polen/tree/main/examples/pokemon) to learn how the changelog is configured.
