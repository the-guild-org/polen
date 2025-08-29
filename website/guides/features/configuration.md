# Configuration

## Introduction

Polen aims to be convention over configuration. However, there are still knobs and levers for when you need it.

## Quickstart

You can use the CLI to scaffold a ready to go config file.

```sh
npx polen config create
```

## File

Polen looks for a module file conforming to these conventions

- Name: `polen.config.[ts,js,mts,cts,mjs,cjs]`
- Location: in the project root.
- Exports: `default` - your config object

## API

Polen exports a function to help you author your configuration, providing type checking, autocomplete, JSDoc.

```ts
import type { Polen } from 'polen'

export default Polen.defineConfig({/* ... */})
```

## Options

Polen's configuration options are thoroughly documented with JSDoc comments. We currently do not document them in this website.

When using `defineConfig` helper your IDE will provide comprehensive documentation, examples, and type information for all configuration options.

## Example

Here's a sample configuration to give you a sense of what's possible:

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  schema: {
    useSources: ['directory'],
    sources: {
      directory: {
        path: './schema',
      },
    },
    augmentations: [
      {
        type: 'description',
        on: {
          type: 'TargetType',
          name: 'Query',
        },
        placement: 'over',
        content: 'Root query operations',
      },
    ],
  },
  templateVariables: {
    title: 'Acme GraphQL API',
    description: 'The official Acme GraphQL API documentation',
  },
  build: {
    architecture: 'ssg',
    basePath: '/api-docs/',
  },
})
```
