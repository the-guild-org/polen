# Polen

A framework for delightful GraphQL developer portals ✨.

## Installation

```
npm add polen vite react react-dom
```

- `vite`, `react`, `react-dom` are peer dependencies of Polen.
- We would like to remove `react` and `react-dom` as peers deps in the future to
  simplify this for you.
  ([see](https://github.com/the-guild-org/polen/pull/9#issuecomment-2801683840))

## Example

You can find working examples in the [examples](./examples) directory.

The following shows minimal default usage.

1. Have a `schema.graphql` GraphQL schema file in your project directory.

   ```graphql
   type Query {
     hello: String
   }
   ```

2. Use Polen in your Vite config.

   ```ts
   import { Polen } from 'polen'

   export default Polen.createConfiguration({
     // options here...
   })
   ```

3. Build your developer portal.

   ```sh
   npx vite build --app
   ```

4. You now have a deployable developer portal. Try it locally
   (http://localhost:5174):

   ```sh
   node dist/entry.js
   ```

## Guide

### Providing a Schema

You can provide a GraphQL schema to Polen in various ways.

#### File

Have a single `schema.graphql` SDL file in your project directory. Example:

```
schema.graphql
```

#### Directory

Have a `schema` directory in your project directory with multiple versions of
your schema as SDL files named using format: `YYYY-MM-DD.graphql`. Example:

```
schema/
  2023-01-13.graphql
  2020-09-26.graphql
```

This approach allows Polen to render a changelog for your schema. Refer to
[Changelog](#changelog).

#### Memory

You can provide a schema to Polen in memory via configuration.

You have control to provide one or multiple schemas, with or without dates.

If no dates are given then the current time is assumed.

If you provide multiple versions then Polen can render a changelog for you.
Refer to [Changelog](#changelog).

Basic example:

```ts
// vite.config.ts
import { Polen } from 'polen'

export default Polen.createConfiguration({
  schema: {
    useDataSources: `memory`,
    dataSources: {
      memory: {
        versions: [{
          date: new Date('2023-01-13'),
          value: `type Query { hello: String }`,
        }],
      },
    },
  },
})
```

### Schema Reference

If you [provide Polen with a schema](#providing-a-schema), Polen will
automatically render reference documentation for it.

If you provide multiple versions of your schema then the reference is based on
the schema with the latest date.

### Schema Changelog

Polen can render a changelog for your schema.

This feature is automatically enabled when you provide multiple versions of your
schema. Refer to [Provide a Schema](#providing-a-schema) for details on how to
do that.

### Schema Augmentations

#### Descriptions

You can append/prepend/replace descriptions of types and fields in your schema.

Any Markdown syntax in your content will be automatically rendered.

```ts
import { Polen } from 'polen'

export default Polen.createConfiguration({
  templateVariables: {
    title: `Pokemon Developer Portal`,
  },
  schemaAugmentations: [
    {
      type: `description`,
      on: {
        type: `TargetType`,
        name: `Query`,
      },
      placement: `over`,
      content:
        `**Content from [Polen](https://github.com/the-guild-org/polen)**.`,
    },
  ],
})
```

### Pages

You can add pages to your developer portal by adding markdown files to the
`pages` directory in your project root directory.

- A file becomes a page.
- The relative (to `pages` directory) file path becomes the web path.
- _Navigation Bar_
  - Top level pages are listed in the navigation bar.
- _Index Pages_
  - A file named `index` is an index page.
  - The file name is elided in the route. For example `foo/index.md` becomes
    route `/foo` .
  - Details:
    - If both `foo/index.md` and `foo.md` exist, then the former is used, latter
      ignored, and a warning is raised.

Example:

| File                 | Route      | Navigation Bar Title |
| -------------------- | ---------- | -------------------- |
| `pages/foo.md`       | `/foo`     | `Foo`                |
| `pages/foo/index.md` | `/foo`     | `Foo`                |
| `pages/foo/bar.md`   | `/foo/bar` | `Foo`                |

### Package

#### ESM

Polen is an ESM only package. If you are using CJS, then you need
[NodeJS version `>=22.0.0` to `require` it](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

#### Exports

You can import a `Polen` namespace from `polen`. You can import its bare exports
from `polen/exports`.

```ts
import { Polen } from 'polen'
import { VitePlugin } from 'polen/exports'

console.log(Polen.VitePlugin === VitePlugin) // true
```

## Other

### Changelog

Refer to
[releases on this repo](https://github.com/the-guild-org/polen/releases).

### Development

If you are working on Polen itself, then refer to
[DEVELOPMENT.md](./DEVELOPMENT.md) for details about workflow, testing, etc.
