# Polen

A framework for delightful GraphQL developer portals ✨.

## Installation

```
npm add polen vite
```

Vite is a peer dependency of Polen.

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
