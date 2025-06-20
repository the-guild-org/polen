# 🌺 Polen

A framework for delightful GraphQL developer portals

## What is Polen?

Polen transforms your GraphQL schema into a beautiful, interactive developer portal with zero configuration. It automatically generates:

- 📖 **Schema Reference** - Interactive documentation for all types, fields, and operations
- 📝 **Changelog** - Track schema evolution over time
- 📄 **Custom Pages** - Add guides, tutorials, and API documentation with Markdown/MDX
- 🎨 **Beautiful UI** - Modern, responsive design out of the box
- 🚀 **Instant Deploy** - Static site generation for easy hosting anywhere

## Quick Start

```sh
# Install Polen
npm add polen

# Create a GraphQL schema file
echo "type Query { hello: String }" > schema.graphql

# Build your developer portal
npx polen build

# Preview locally
node build/app.js
```

Visit http://localhost:3001 to see your developer portal!

## Live Demos

Experience Polen in action with our live documentation sites:

### 🌐 [View All Demos](https://the-guild-org.github.io/polen/)

Featured examples:
- **[Pokemon GraphQL API](https://the-guild-org.github.io/polen/latest/pokemon/)** - Explore a fun GraphQL API with rich schema documentation
- **GitHub GraphQL API** (Coming soon) - Browse GitHub's extensive GraphQL API documentation

## Documentation

- **[Getting Started](./docs/getting-started.md)** - Installation and quick start guide
- **[Schema Configuration](./docs/guide/schema.md)** - Configure your GraphQL schema
- **[Custom Pages](./docs/guide/pages.md)** - Add documentation with Markdown and MDX
- **[Build & Deploy](./docs/guide/build.md)** - Build configuration and deployment options
- **[CLI Reference](./docs/cli/index.md)** - All available commands
- **[Package API](./docs/api/package.md)** - Programmatic usage

### Features

- **[Static Rebase](./docs/features/static-rebase.md)** - Update base paths without rebuilding
- **[Syntax Highlighting](./docs/features/syntax-highlighting.md)** - Beautiful code blocks with language support

## Examples

Find complete example projects in the [examples](./examples) directory:

- `pokemon` - Fun Pokemon API documentation
- `github` - GitHub GraphQL API (coming soon)
- `minimal` - Minimal setup example

## Why Polen?

- **Zero Configuration** - Works out of the box with just a GraphQL schema
- **Developer Focused** - Built specifically for GraphQL API documentation
- **Modern Stack** - React, TypeScript, and Vite for fast builds
- **Flexible** - Customize everything from branding to page structure
- **Static or Server** - Deploy as static files or run as a Node.js server

## Contributing

We welcome contributions! See [DEVELOPMENT.md](./DEVELOPMENT.md) for:

- Development setup
- Architecture overview
- Testing guidelines
- Contribution process

## Changelog

See [releases](https://github.com/the-guild-org/polen/releases) for a detailed changelog.

## License

MIT © [The Guild](https://the-guild.dev)