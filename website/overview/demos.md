# Demos

Explore Polen in action with our live demos. These examples showcase different use cases and configurations to help you understand Polen's capabilities.

## Live

### [Hive](https://the-guild-org.github.io/polen/demos/hive/)

Experience Polen documenting The Guild's [GraphQL Hive](https://graphql-hive.com) API. This demo showcases:

- Schema documentation with real-world complexity
- Multi-page MDX content

### [Pokemon](https://the-guild-org.github.io/polen/demos/pokemon/)

Explore Polen's changelog feature with a fun Pokemon GraphQL API that evolves over time. This demo showcases:

- Schema changelog with 10 versions spanning almost 2 years
- Criticality grouping (breaking, dangerous, and safe changes)
- All 50+ types of GraphQL schema changes
- Interactive sidebar for navigating between releases

## Run Locally

You can also run any demo locally to explore the source code, for example:

```bash
git clone https://github.com/the-guild-org/polen.git
cd polen

pnpm install

# Run Hive demo
cd examples/hive
pnpm dev

# Or run Pokemon demo
cd examples/pokemon
pnpm dev
```

## Future

We're interested in additional examples to showcase more of Polen:

- Different kinds of markdown content
- Huge schemas (think GitHub API)
- Serverful demos
