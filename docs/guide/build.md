# Build Configuration

When you build you may choose between SSG and SSR. The default is SSG.

## SSG

```sh
npx polen build --type ssg
```

Deploy the contents of the `./build` directory on your favourite static site provider.

## SSR

In the future Polen will have features that motivate using a server, but for now there is no particular benefit. Use `SSG` instead.

## Base Path Configuration

Polen supports deploying to subdirectories through the `build.base` configuration option. This is useful for:

- GitHub Pages project sites (e.g., `/my-project/`)
- PR preview deployments (e.g., `/pr-123/`)
- Hosting multiple Polen sites on one domain

```ts
// polen.config.ts
import { Polen } from 'polen'

export default Polen.defineConfig({
  build: {
    base: '/my-project/', // Must start and end with /
  },
})
```

When configured, Polen will output differently:

- For SSG architecture:
  - Generate static files that work in the subdirectory
- For SSR architecture:
  - A server that serves static assets from the correct path

You can also set the base path via CLI:

```bash
npx polen build --base /my-project/
npx polen dev --base /my-project/
```

The CLI flag takes precedence over the config file setting.

## Custom Logo

You can provide a custom logo for your developer portal by placing a `logo.svg` file in your project's `public` directory:

```
public/
  logo.svg
```

Polen will automatically use this logo in the navigation bar instead of the default Polen logo.
