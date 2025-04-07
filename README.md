# Polen

A framework for delightful GraphQL developer portals ✨.

## Installation

```
npm add polen vite
```

Vite is a peer dependency of Polen.

## Usage

The following shows minimal default usage.

1. Have a GraphQL schema file in the same directory that you run `vite`.

   ```graphql
   type Query {
      	hello: String
    	}
   ```

2. Use Polen in your Vite config.

   ```ts
   import { defineConfig } from 'vite'
   import { Polen } from 'polen'

   export default defineConfig({
     plugins: [
       Polen.VitePlugin({
         // options here...
       }),
     ],
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

## Examples

You can find working examples in the [examples](./examples) directory.
