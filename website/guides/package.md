# Package

Polen is distributed as an ESM-only package. This guide covers what that means for your project and how to manage dependencies effectively.

## ESM-Only Package

Polen is published as an ECMAScript Module (ESM) package. This modern approach provides better tree-shaking, faster parsing, and aligns with Vite and the wider JavaScript ecosystem's direction.

### Using Polen in Your Project

#### Option 1: ESM Project (Recommended)

If your project uses ESM (`"type": "module"` in package.json):

```json
{
  "type": "module",
  "scripts": {
    "dev": "polen dev",
    "build": "polen build"
  }
}
```

Everything works out of the box.

#### Option 2: CommonJS Project

If your project uses CommonJS (no `"type": "module"`), you'll need:

- **[Node.js 22.12.0+](https://nodejs.org/en/blog/release/v22.12.0)** - Supports [`require()` of ESM packages](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require) natively
- **[Node.js 20.17.0+](https://nodejs.org/en/blog/release/v20.17.0)** - Works with the [`--experimental-require-module`](https://nodejs.org/api/cli.html#--experimental-require-module) flag

```json
{
  "scripts": {
    "dev": "node --experimental-require-module node_modules/.bin/polen dev",
    "build": "node --experimental-require-module node_modules/.bin/polen build"
  }
}
```

> **Note**: The experimental flag is only needed for Node.js 20.x. Node.js 22.12+ doesn't require it.

### TypeScript Configuration

When using Polen with TypeScript, ensure your `tsconfig.json` uses modern module resolution:

```json
{
  "compilerOptions": {
    "module": "Node16", // or "Bundler"
    "moduleResolution": "Node16" // or "Bundler"
  }
}
```

These settings ensure TypeScript understands ESM imports and package.json `exports` fields correctly.

## Managing Dependencies

Polen bundles many dependencies to provide a zero-install experience. However, you might want to manage some dependencies yourself for better IDE support or version control.

### Bundled Packages

Polen includes these packages that you can use without installing:

```typescript
import { GitHubLogoIcon } from 'polen/radix-ui/react-icons'
import { Badge, Button } from 'polen/radix-ui/themes'
```

### Bringing Your Own Dependencies

You may want to install packages yourself for:

- Direct control over package versions
- Using additional features not exposed by Polen
- Consistency with other packages in your project

#### Example: Installing Radix UI

```bash
npm install @radix-ui/themes @radix-ui/react-icons
```

Then import directly (to use for example in [navbar](/guides/features/navbar) customization):

```typescript
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Badge, Button } from '@radix-ui/themes'
```

### When to Use Your Own Dependencies

Consider installing packages yourself when:

1. **You need a newer version** - Polen's bundled version doesn't have a feature you need
2. **You're already using the package** - Consistency across your project
3. **You need the full package** - Polen might only expose a subset of exports

> **Important**: If you're happy with Polen's bundled version, just use it via `polen/radix-ui/themes`. Installing your own is only needed for specific requirements.

### Dealing with Version Conflicts

If you must use a different version than Polen bundles, you might encounter peer dependency warnings or conflicts. Most modern bundlers handle this well, but if you need to force resolutions:

#### pnpm

In `package.json` using [overrides](https://pnpm.io/package_json#resolutionsdependenciesmetainjected):

```json
{
  "pnpm": {
    "overrides": {
      "@radix-ui/themes": "^4.0.0" // Your required version
    }
  }
}
```

#### Yarn

In `package.json` using [resolutions](https://classic.yarnpkg.com/en/docs/selective-version-resolutions/):

```json
{
  "resolutions": {
    "@radix-ui/themes": "^4.0.0" // Your required version
  }
}
```

#### npm

In `package.json` using [overrides](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides):

```json
{
  "overrides": {
    "@radix-ui/themes": "^4.0.0" // Your required version
  }
}
```

## Troubleshooting

### "Cannot use import statement outside a module"

This error means Node.js is trying to run ESM code in CommonJS mode. Solutions:

1. Add `"type": "module"` to your package.json
2. Upgrade to Node.js 22.12.0+
3. Use `--experimental-require-module` flag (Node.js 20.17.0+)
