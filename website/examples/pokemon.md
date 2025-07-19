# Pokemon Example

Explore Polen's powerful changelog feature with a fun Pokemon GraphQL API that evolves over time.

[**View Live Example →**](https://polen.js.org/examples/pokemon/)

## Features Showcased

This example highlights:

- **Schema Changelog**: 10 versions spanning almost 2 years of API evolution
- **Change Criticality**: Breaking, dangerous, and safe changes clearly grouped
- **All Change Types**: Demonstrates 50+ types of GraphQL schema changes
- **Interactive Navigation**: Easy browsing between releases via sidebar
- **Version Comparison**: See exactly what changed between any two versions

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

- `polen.config.ts` - Configuration with multiple schema versions
- `schema/` - Directory containing versioned schema files (one per version)
- `schema/2022-11-01.graphql` - Initial Pokemon API schema
- `schema/2024-09-30.graphql` - Latest evolution with all Pokemon types

## Source Code

Check out the [source code on GitHub](https://github.com/the-guild-org/polen/tree/main/examples/pokemon) to learn how the changelog is configured.
