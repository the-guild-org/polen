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

1. Have a GraphQL schema file in the same directory that you run `vite`.

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

### Pages

You can add pages to your developer portal by adding markdown files to the
`pages` directory in your project root directory.

- A file becomes a page.
- The path to the file is used as the path to the page.
- A file can be an _index_ page:
  - A file named `index` is an index page.
  - The file name is elided in the route. For example `foo/index.md` becomes
    route `/foo` .
  - If both `foo/index.md` and `foo.md` exist, then the former is used, latter
    ignored, and warning raised.

Example:

| File                 | Route      | Navigation Bar Title |
| -------------------- | ---------- | -------------------- |
| `pages/foo.md`       | `/foo`     | `Foo`                |
| `pages/foo/index.md` | `/foo`     | `Foo`                |
| `pages/foo/bar.md`   | `/foo/bar` | `Foo`                |

### Schema Augmentations

#### Schema Descriptions

You can append/prepend/replace descriptions of types and fields in your schema.

```ts
import { Polen } from 'polen'

export default Polen.createConfiguration({
  templateVariables: {
    title: `Basic Developer Portal`,
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
