# CLI Reference

Polen provides several CLI commands to help you develop and deploy your GraphQL developer portal.

## Commands

### `polen create`

Create a new Polen project from a template.

```sh
npx polen create [name] [options]
```

Arguments:

- `[name]` - The name of your project (optional, defaults to a random name)

Options:

- `--path <path>`, `-p` - Directory to create the project in
- `--example <name>`, `-e` - Example template to use (default: `hive`)
- `--version <version>`, `-v` - Polen version to install (default: latest)
- `--link`, `-l` - Link to a local Polen installation instead of installing from npm

Examples:

```sh
# Create with default settings
npx polen create

# Create with a specific name
npx polen create my-api-docs

# Create in a specific directory
npx polen create my-docs --path ./projects/docs

# Use a specific Polen version
npx polen create --version 1.2.3

# Use local Polen installation (for development)
npx polen create my-docs --link
```

### `polen build`

Build your developer portal for production deployment.

```sh
npx polen build [options]
```

Options:

- `--architecture <type>`, `-a` - Build architecture: `ssg` (default) or `ssr`
- `--base <path>`, `-b` - Base path for deployment (e.g., `/my-project/`)
- `--debug`, `-d` - Enable debug mode (default: false)

### `polen dev`

Start the development server with hot reloading.

```sh
npx polen dev [options]
```

Options:

- `--base <path>`, `-b` - Base path for development (e.g., `/my-project/`)
- `--debug`, `-d` - Enable debug mode
- `--project <path>`, `-p` - The path to the project directory (default: current working directory)

### `polen open`

Instantly view any GraphQL schema with Polen's schema explorer. You can provide a schema in three ways: from a well-known API, via introspection, or from an SDL file.

```sh
npx polen open [options]
```

Options (mutually exclusive):

- `--name <name>`, `-n` - Name of a well-known schema: `github` or `hive`
- `--introspect <url>`, `-i` - Get schema via GraphQL introspection from a URL
- `--sdl <path>`, `-s` - Get schema from an SDL file (local path or HTTP URL)

Additional options:

- `--introspection-headers <json>` - Headers for introspection requests (JSON format)

Examples:

```sh
# Open a well-known schema
npx polen open --name github

# Introspect a GraphQL endpoint
npx polen open --introspect https://api.graphql-hive.com/graphql

# Introspect with authentication (using environment variable)
npx polen open --introspect https://api.github.com/graphql \
  --introspection-headers "{\"Authorization\": \"Bearer $GITHUB_TOKEN\"}"

# Load from a local SDL file
npx polen open --sdl ./schema.graphql

# Load from a remote SDL file
npx polen open --sdl https://docs.github.com/public/fpt/schema.docs.graphql
```

### `polen config create`

Create a Polen configuration file.

```sh
npx polen config create
```

This command:

- Creates a `polen.config.ts` file in the current directory
- Does nothing if the file already exists
- Scaffolds a basic TypeScript configuration with type-safe imports

The generated file contains:

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  // Your configuration options
})
```

### `polen static rebase`

Update the base path of a built Polen site without rebuilding.

```sh
npx polen static rebase <source> <newBasePath> [options]
```

Arguments:

- `<source>` - Path to the Polen build directory to rebase
- `<newBasePath>` - New base path for the build (e.g., `/new-path/`)

Options:

- `--target <path>`, `-t` - Target directory for copy mode. If not provided, mutates in place

Examples:

```sh
# Mutate in place (default)
npx polen static rebase ./build /new-base/

# Copy to new location
npx polen static rebase ./build /staging/ --target ./build-staging
```

Learn more in the [Static Rebase documentation](../deployment-ssg/rebasing).

## Global Options

All commands support these global options:

- `--help` - Show help for the command
- `--version` - Show Polen version
