# Package Information

## ESM

Polen is an ESM only package. If you are using CJS, then you need
[NodeJS version `>=22.0.0` to `require` it](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).

## Exports

You can import a `Polen` namespace from `polen`. You can import its bare exports
from `polen/polen`.

```ts
import { Polen } from 'polen'
import { defineConfig } from 'polen/polen'

console.log(Polen.defineConfig === defineConfig) // true
```

## API Reference

### `Polen.defineConfig(config)`

Define your Polen configuration with type safety.

```ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  // Your configuration options
})
```

See the [configuration reference](./configuration.md) for all available options.