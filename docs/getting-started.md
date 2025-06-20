# Getting Started

## Installation

```sh
npm add polen
```

## Quickstart

1. Have a `schema.graphql` GraphQL schema file in your project directory.

   ```graphql
   type Query {
     hello: String
   }
   ```

2. Build your developer portal.

   ```sh
   npx polen build
   ```

3. You now have a deployable developer portal. Try it locally
   (http://localhost:3001):

   ```sh
   node build/app.js
   ```

## Next Steps

- [Configure your schema](./guide/schema.md) - Learn about different ways to provide your GraphQL schema
- [Add custom pages](./guide/pages.md) - Create documentation pages with Markdown and MDX
- [Customize your build](./guide/build.md) - Configure deployment options and base paths
- [Explore CLI commands](./cli/index.md) - Discover all available Polen commands