# CLI Reference

Polen provides several CLI commands to help you develop and deploy your GraphQL developer portal.

## Commands

### `polen build`

Build your developer portal for production deployment.

```sh
npx polen build [options]
```

Options:

- `--type <type>` - Build type: `ssg` (default) or `ssr`
- `--base <path>` - Base path for deployment (e.g., `/my-project/`)

### `polen dev`

Start the development server with hot reloading.

```sh
npx polen dev [options]
```

Options:

- `--base <path>` - Base path for development (e.g., `/my-project/`)

### `polen open`

Instantly view any GraphQL schema with Polen's schema explorer.

```sh
npx polen open [options]
```

Options:

- `--name <name>` - Name of a well-known schema (e.g., `github`)
- `--help` - Show detailed help for the open command

Example:

```sh
npx polen open --name github
```

### `polen static rebase`

Update the base path of a built Polen site without rebuilding.

```sh
npx polen static rebase <source-path> [options]
```

Options:

- `--new-base-path <path>` - New base path (must start and end with `/`)
- `--mode <mode>` - Change mode: `mutate` (default) or `copy`
- `--target <path>` - Target directory (required when using `copy` mode)

Learn more in the [Static Rebase documentation](../features/static-rebase.md).

## Global Options

All commands support these global options:

- `--help` - Show help for the command
- `--version` - Show Polen version
