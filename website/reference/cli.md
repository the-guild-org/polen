---
# THIS FILE IS AUTO-GENERATED - DO NOT EDIT
# Run 'pnpm website:cli-docs' to regenerate
---

# CLI Reference

Polen provides several CLI commands to help you develop and deploy your GraphQL developer portal.

## Common Options

Most Polen commands that operate on projects accept these common options:

- `--project <path>`, `-p` - Path to the project directory (default: current working directory)
- `--allow-global` - Allow global installation (when running globally installed Polen)

## Commands
### `cache`

#### Usage

```sh
polen cache [options]
```

### `config`

#### Usage

```sh
polen config [options]
```

### `static`

#### Usage

```sh
polen static [options]
```

### `build`

#### Usage

```sh
polen build [options]
```

#### Arguments

- `project` (required)
  - The path to the project directory. Default is CWD (current working directory).
  - Type: `string`

#### Options

| Option | Alias | Type | Required | Default | Description |
|--------|-------|------|----------|---------|-------------|
| `--debug` | `-d` | boolean | No | `true` | Enable debug mode |
| `--architecture` | `-a` | ssg | ssr | No | - | Which kind of application architecture to output. |
| `--base` | `-b` | string | No | - | Base public path for deployment (e.g., /my-project/) |
| `--port` | `` | number | No | - | Default port for the SSR application |
| `--allow-global` | `` | boolean | No | `true` | Allow using global Polen in a project with local Polen. Not recommended as it can cause version conflicts. |

### `create`

#### Usage

```sh
polen create [options]
```

#### Arguments

- `name` (required)
  - The name of your project. Used by the package name and the default path. Defaults to a random name.
  - Type: `string`
- `path` (required)
  - The path to a directory to create your project. Must point to an empty or non-existing directory. Defaults to a new directory named after your project in your cwd (current working directory).
  - Type: `string`

#### Options

| Option | Alias | Type | Required | Default | Description |
|--------|-------|------|----------|---------|-------------|
| `--link` | `` | boolean | No | `true` | When installing polen, do so as a link. You must have Polen globally linked on your machine. |
| `--version` | `` | string | No | - | Version of Polen to use. Defaults to latest release. Ignored if --link is used. |
| `--example` | `` | hive | No | - | The example to use to scaffold your project. |

### `dev`

#### Usage

```sh
polen dev [options]
```

#### Arguments

- `project` (required)
  - The path to the project directory. Default is CWD (current working directory).
  - Type: `string`

#### Options

| Option | Alias | Type | Required | Default | Description |
|--------|-------|------|----------|---------|-------------|
| `--debug` | `-d` | boolean | No | `true` | Enable debug mode |
| `--base` | `-b` | string | No | - | Base public path for deployment (e.g., /my-project/) |
| `--port` | `` | number | No | - | Port to run the development server on |
| `--allow-global` | `` | boolean | No | `true` | Allow using global Polen in a project with local Polen. Not recommended as it can cause version conflicts. |

### `hero-image`

Generate AI hero image using Pollinations.ai

#### Usage

```sh
polen hero-image [options]
```

#### Arguments

- `project` (required)
  - The path to the project directory. Default is CWD (current working directory).
  - Type: `string`

#### Options

| Option | Alias | Type | Required | Default | Description |
|--------|-------|------|----------|---------|-------------|
| `--overwrite` | `` | boolean | No | `true` | Skip backup and overwrite existing hero image |

### `open`

#### Usage

```sh
polen open [options]
```

#### Options

| Option | Alias | Type | Required | Default | Description |
|--------|-------|------|----------|---------|-------------|
| `--introspection-headers` | `-inh` | string | No | - | Include headers in the introspection query request sent when using --introspection-url. Format is JSON Object. |
| `--introspect` | `-in` | string | No | - | Get the schema by sending a GraphQL introspection query to this URL. |
| `--sdl` | `-s` | string | No | - | Get the schema from a GraphQL Schema Definition Language file. Can be a path to a local file or an HTTP URL to a remote one. |
| `--name` | `-n` | github | hive | No | - | Pick from a well known public API. Polen already knows how to fetch the schema for these APIs. |
| `--cache` | `` | boolean | No | `true` | Enable or disable caching. By default this command caches fetched schemas for re-use. |
| `--allow-global` | `` | boolean | No | `true` | Allow using global Polen in a project with local Polen. Not recommended as it can cause version conflicts. |


### Global Options

All commands support these global options:

- `--allow-global` - Allow using global Polen in a project with local Polen. Not recommended as it can cause version conflicts.

Additionally, the following standard options are available:

- `--help` - Show help for the command
- `--wizard` - Start wizard mode for guided command construction
- `--completions <shell>` - Generate shell completions for bash/zsh/fish