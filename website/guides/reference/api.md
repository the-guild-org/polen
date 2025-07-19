# API

## Package

Polen is an ESM only package. If you are using CJS, then you need
[NodeJS version `>=22.0.0` to `require` it](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

## /‌

### Overview

You can import the `Polen` namespace from the root entrypoint or you can import its bare exports from `polen/polen`.

```ts
import { Polen } from 'polen'
import { defineConfig } from 'polen/polen'

console.log(Polen.defineConfig === defineConfig) // true
```

### Value `Polen.defineConfig(config)`

Define your Polen configuration with type safety. Learn more at [Configuration](/guides/features/configuration)

### Value `Polen.VitePlugin`

Vite plugin for integrating Polen into a custom Vite setup. This is an advanced feature for users who need more control over their build process.

```ts
import { Polen } from 'polen'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Polen.VitePlugin({
      // Polen configuration
    }),
  ],
})
```

### Type `Polen.ConfigInput`

TypeScript type for the configuration input.

## /polen

Bare exports within the Polen namespace [see /](#/‌).

## /components

Polen provides React components for use in MDX pages. Learn more at [Pages](/guides/features/pages).
